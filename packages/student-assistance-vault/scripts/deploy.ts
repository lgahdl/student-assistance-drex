import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

interface DrexDeployment {
  contracts: {
    realDigital: string;
    str: string;
  };
  deployer: string;
}

interface TestStudent {
  name: string;
  address: string;
  monthlyAmount: bigint;
}

interface DeploymentInfo {
  network: string;
  timestamp: string;
  deployer: string;
  admin: string;
  contracts: {
    StudentAssistanceVault: string;
    DrexToken: string;
  };
  testStudents: Array<{
    name: string;
    address: string;
    monthlyAmount: string;
  }>;
  summary: {
    totalStudents: string;
    totalExpectedMonthly: string;
    maxStudents: string;
    maxBatchSize: string;
  };
}

interface DeploymentResult {
  vault: string;
  drexToken: string;
  admin: string;
  totalExpected: string;
}

async function main(): Promise<DeploymentResult> {
  console.log("🚀 Deploying StudentAssistanceVault...");
  console.log("=" .repeat(50));
  
  // Get signers - use deployer for deployment but specific admin address for vault admin
  let deployer;
  try {
    const signers = await ethers.getSigners();
    if (!signers || signers.length === 0) {
      throw new Error("No signers available. Make sure you're connected to a network.");
    }
    deployer = signers[0];
    if (!deployer) {
      throw new Error("Deployer signer is undefined");
    }
  } catch (error) {
    console.error("❌ Failed to get signers:", error);
    throw error;
  }
  
  // Define the specific admin address for the vault
  const ADMIN_ADDRESS = "0xA1a522D50F2b72E6F395f3203961149C5B4d09A1";
  
  console.log("📋 Deployment Details:");
  console.log("Deployer address:", deployer.address);
  console.log("Vault Admin address:", ADMIN_ADDRESS);
  
  try {
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Deployer balance:", ethers.formatEther(balance), "ETH");
  } catch (error) {
    console.error("❌ Failed to get deployer balance:", error);
    throw error;
  }
  
  // Read DREX deployment info
  console.log("\n🔍 Reading DREX deployment info...");
  const drexDeploymentPath = path.join(__dirname, "../../drex-piloto/drex-deployment.json");
  
  let drexDeployment: DrexDeployment;
  try {
    const drexData = fs.readFileSync(drexDeploymentPath, 'utf8');
    drexDeployment = JSON.parse(drexData);
    console.log("✅ DREX deployment info loaded");
    console.log("📋 DREX deployment data:", JSON.stringify(drexDeployment, null, 2));
  } catch (error) {
    console.error("❌ Could not read DREX deployment info from:", drexDeploymentPath);
    console.error("Please deploy DREX first using: cd packages/drex-piloto && npm run deploy");
    throw error;
  }
  
  if (!drexDeployment.contracts || !drexDeployment.contracts.realDigital) {
    throw new Error("Invalid DREX deployment data: missing contracts.realDigital");
  }
  
  const DREX_TOKEN_ADDRESS = drexDeployment.contracts.realDigital;
  console.log("🪙 DREX Token Address:", DREX_TOKEN_ADDRESS);
  
  // Deploy StudentAssistanceVault with the specific admin address
  console.log("\n📦 Deploying StudentAssistanceVault...");
  const StudentAssistanceVault = await ethers.getContractFactory("StudentAssistanceVault");
  
  const vault = await StudentAssistanceVault.deploy(
    DREX_TOKEN_ADDRESS,
    ADMIN_ADDRESS  // Use the specific admin address
  );
  
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  
  console.log("✅ StudentAssistanceVault deployed to:", vaultAddress);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const drexToken = await vault.drexToken();
  const hasAdminRole = await vault.hasRole(await vault.ADMIN_ROLE(), ADMIN_ADDRESS);
  const maxStudents = await vault.MAX_STUDENTS();
  const maxBatchSize = await vault.MAX_BATCH_SIZE();
  
  console.log("DREX Token:", drexToken);
  console.log("Admin has ADMIN_ROLE:", hasAdminRole);
  console.log("Max Students:", maxStudents.toString());
  console.log("Max Batch Size:", maxBatchSize.toString());
  
  // Note: We won't register test students here since we want the admin to do it through the dashboard
  console.log("\n👥 Test students will be registered through the dashboard by the admin");
  console.log("Admin address:", ADMIN_ADDRESS);
  console.log("Student address to register:", "0xA7868E049c067A49CD33726D3Edc4163a147B4Ad");
  
  // Check final state
  console.log("\n📊 Final State:");
  const studentCount = await vault.getStudentCount();
  const totalExpected = await vault.getTotalExpectedAmount();
  
  console.log("Total Students:", studentCount.toString());
  console.log("Total Expected Monthly:", ethers.formatEther(totalExpected), "DREX");
  
  // Save deployment info
  const deploymentInfo: DeploymentInfo = {
    network: "besu",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    admin: ADMIN_ADDRESS,
    contracts: {
      StudentAssistanceVault: vaultAddress,
      DrexToken: DREX_TOKEN_ADDRESS
    },
    testStudents: [], // No test students registered during deployment
    summary: {
      totalStudents: studentCount.toString(),
      totalExpectedMonthly: ethers.formatEther(totalExpected),
      maxStudents: maxStudents.toString(),
      maxBatchSize: maxBatchSize.toString()
    }
  };
  
  // Save to file
  const deployInfoPath = path.join(__dirname, "..", "vault-deployment.json");
  fs.writeFileSync(deployInfoPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n💾 Deployment info saved to:", deployInfoPath);
  
  // Instructions for next steps
  console.log("\n🎯 Next Steps:");
  console.log("1. Fund the vault with DREX tokens:");
  console.log(`   Amount needed: ${ethers.formatEther(totalExpected)} DREX`);
  console.log(`   Vault address: ${vaultAddress}`);
  console.log("\n2. Call distributeMonthlyAllowances() or distributeBatch() to distribute funds");
  console.log("\n3. Students can then use transfer() function to spend their allowances");
  
  console.log("\n🔧 Useful Commands:");
  console.log(`npm run fund`);
  console.log(`npm run distribute`);
  
  console.log("\n=" .repeat(50));
  console.log("🎉 StudentAssistanceVault deployment completed successfully!");

  return {
    vault: vaultAddress,
    drexToken: DREX_TOKEN_ADDRESS,
    admin: ADMIN_ADDRESS,
    totalExpected: ethers.formatEther(totalExpected)
  };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((result: DeploymentResult) => {
    console.log("\n🎉 Deployment completed successfully!");
    console.log("Result:", result);
    process.exit(0);
  })
  .catch((error: Error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }); 