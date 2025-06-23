import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DrexDeployment {
  contracts: {
    realDigital: string;
  };
}

async function main(): Promise<void> {
  console.log("💰 Funding StudentAssistanceVault with DREX...");
  console.log("=" .repeat(50));
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  // Read DREX deployment info
  const drexDeploymentPath = path.join(__dirname, "../../drex-piloto/drex-deployment.json");
  let drexDeployment: DrexDeployment;
  
  try {
    const drexData = fs.readFileSync(drexDeploymentPath, 'utf8');
    drexDeployment = JSON.parse(drexData);
  } catch (error) {
    console.error("❌ Could not read DREX deployment info");
    throw error;
  }
  
  // Read vault deployment info
  const vaultDeploymentPath = path.join(__dirname, "../vault-deployment.json");
  let vaultDeployment: any;
  
  try {
    const vaultData = fs.readFileSync(vaultDeploymentPath, 'utf8');
    vaultDeployment = JSON.parse(vaultData);
  } catch (error) {
    console.error("❌ Could not read vault deployment info");
    throw error;
  }
  
  const drexTokenAddress = drexDeployment.contracts.realDigital;
  const vaultAddress = vaultDeployment.contracts.StudentAssistanceVault;
  
  console.log("DREX Token:", drexTokenAddress);
  console.log("Vault Address:", vaultAddress);
  
  // Connect to DREX token
  const drexToken = await ethers.getContractAt("IERC20", drexTokenAddress);
  
  // Check deployer balance
  const deployerBalance = await drexToken.balanceOf(deployer.address);
  console.log("Deployer DREX balance:", ethers.formatEther(deployerBalance), "DREX");
  
  // Use available balance (leave some for gas)
  const amount = deployerBalance;
  console.log("💰 Transferring", ethers.formatEther(amount), "DREX to vault...");
  
  const tx = await drexToken.transfer(vaultAddress, amount);
  await tx.wait();
  
  console.log("✅ Vault funded with", ethers.formatEther(amount), "DREX");
  
  // Verify vault balance
  const vaultBalance = await drexToken.balanceOf(vaultAddress);
  console.log("📊 Vault balance:", ethers.formatEther(vaultBalance), "DREX");
  
  console.log("=" .repeat(50));
  console.log("🎉 Vault funding completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error("❌ Funding failed:", error);
    process.exit(1);
  }); 