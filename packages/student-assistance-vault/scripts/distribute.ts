import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main(): Promise<void> {
  console.log("📦 Distributing Monthly Allowances...");
  console.log("=" .repeat(50));
  
  const [deployer] = await ethers.getSigners();
  console.log("Admin:", deployer.address);
  
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
  
  const vaultAddress = vaultDeployment.contracts.StudentAssistanceVault;
  console.log("Vault Address:", vaultAddress);
  
  // Connect to vault
  const vault = await ethers.getContractAt("StudentAssistanceVault", vaultAddress);
  
  // Check current state
  const studentCount = await vault.getStudentCount();
  const totalExpected = await vault.getTotalExpectedAmount();
  const contractBalance = await vault.getContractBalance();
  
  console.log("📊 Current State:");
  console.log("Students:", studentCount.toString());
  console.log("Total Expected:", ethers.formatEther(totalExpected), "DREX");
  console.log("Contract Balance:", ethers.formatEther(contractBalance), "DREX");
  
  if (contractBalance < totalExpected) {
    console.log("⚠️  Insufficient balance for full distribution");
    console.log("Available:", ethers.formatEther(contractBalance), "DREX");
    console.log("Needed:", ethers.formatEther(totalExpected), "DREX");
  }
  
  // Distribute monthly allowances
  console.log("\n💸 Distributing monthly allowances...");
  const tx = await vault.distributeMonthlyAllowances();
  const receipt = await tx.wait();
  
  console.log("✅ Monthly allowances distributed!");
  console.log("Transaction Hash:", receipt!.hash);
  console.log("Gas Used:", receipt!.gasUsed.toString());
  
  // Verify distribution
  console.log("\n🔍 Verifying distribution...");
  for (let i = 0; i < Number(studentCount); i++) {
    const studentAddr = await vault.getStudentAtIndex(i);
    const studentInfo = await vault.getStudentInfo(studentAddr);
    const balance = await vault.getStudentBalance(studentAddr);
    
    console.log(`Student ${i + 1}: ${studentAddr}`);
    console.log(`  Monthly Amount: ${ethers.formatEther(studentInfo.monthlyAmount)} DREX`);
    console.log(`  Current Balance: ${ethers.formatEther(balance)} DREX`);
  }
  
  console.log("\n=" .repeat(50));
  console.log("🎉 Distribution completed successfully!");
  console.log("\n🎯 Next Steps:");
  console.log("Students can now make transfers using their allowances!");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error("❌ Distribution failed:", error);
    process.exit(1);
  }); 