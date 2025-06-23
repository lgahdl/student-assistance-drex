import { ethers } from "hardhat";
import fs from "fs";
import hre from "hardhat";

interface DeploymentInfo {
  network: string;
  timestamp: string;
  contracts: {
    realDigital: string;
    addressDiscovery: string;
    keyDictionary: string;
    str: string;
  };
  deployer: string;
  testBalance: string;
}

async function main(): Promise<DeploymentInfo> {
  console.log("🚀 Starting DREX Infrastructure Deployment...");
  console.log("=".repeat(50));
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
  console.log("🌐 Network:", hre.network.name);

  // Deploy RealDigital (DREX) - this includes CBDCAccessControl functionality
  console.log("\n💰 Deploying RealDigital (DREX)...");
  const RealDigital = await ethers.getContractFactory("RealDigital");
  const realDigital = await RealDigital.deploy(
    "Real Digital",
    "BRL",
    deployer.address, // authority
    deployer.address  // admin
  );
  await realDigital.waitForDeployment();
  const realDigitalAddress = await realDigital.getAddress();
  console.log("✅ RealDigital deployed to:", realDigitalAddress);

  // Deploy AddressDiscovery
  console.log("\n🔍 Deploying AddressDiscovery...");
  const AddressDiscovery = await ethers.getContractFactory("AddressDiscovery");
  const addressDiscovery = await AddressDiscovery.deploy(deployer.address, deployer.address);
  await addressDiscovery.waitForDeployment();
  const addressDiscoveryAddress = await addressDiscovery.getAddress();
  console.log("✅ AddressDiscovery deployed to:", addressDiscoveryAddress);

  // Deploy KeyDictionary
  console.log("\n🔑 Deploying KeyDictionary...");
  const KeyDictionary = await ethers.getContractFactory("KeyDictionary");
  const keyDictionary = await KeyDictionary.deploy(realDigitalAddress);
  await keyDictionary.waitForDeployment();
  const keyDictionaryAddress = await keyDictionary.getAddress();
  console.log("✅ KeyDictionary deployed to:", keyDictionaryAddress);

  // Deploy STR (Sistema de Transferência de Reservas)
  console.log("\n🏦 Deploying STR...");
  const STR = await ethers.getContractFactory("STR");
  const str = await STR.deploy(realDigitalAddress);
  await str.waitForDeployment();
  const strAddress = await str.getAddress();
  console.log("✅ STR deployed to:", strAddress);

  // Setup DREX permissions
  console.log("\n🔐 Setting up DREX permissions...");
  const MINTER_ROLE = await realDigital.MINTER_ROLE();
  const BURNER_ROLE = await realDigital.BURNER_ROLE();
  const ACCESS_ROLE = await realDigital.ACCESS_ROLE();
  
  await realDigital.grantRole(MINTER_ROLE, strAddress);
  await realDigital.grantRole(BURNER_ROLE, strAddress);
  await realDigital.grantRole(ACCESS_ROLE, deployer.address);
  console.log("✅ STR granted MINTER and BURNER roles");
  console.log("✅ Deployer granted ACCESS_ROLE");

  // Enable deployer account for DREX (now that deployer has ACCESS_ROLE)
  console.log("\n🔓 Enabling deployer account...");
  console.log("Deployer address:", deployer.address);
  console.log("Has ACCESS_ROLE before enable:", await realDigital.hasRole(ACCESS_ROLE, deployer.address));
  
  const enableTx = await realDigital.enableAccount(deployer.address);
  await enableTx.wait();
  console.log("✅ EnableAccount transaction completed");
  
  const isEnabledAfter = await realDigital.verifyAccount(deployer.address);
  console.log("Account enabled after transaction:", isEnabledAfter);

  // Test minting some tokens
  console.log("\n🪙 Testing DREX minting...");
  
  // Debug: Check deployer permissions
  const hasAccessRole = await realDigital.hasRole(ACCESS_ROLE, deployer.address);
  const isAccountEnabled = await realDigital.verifyAccount(deployer.address);
  console.log("🔍 Debug - Deployer has ACCESS_ROLE:", hasAccessRole);
  console.log("🔍 Debug - Deployer account enabled:", isAccountEnabled);
  
  const mintAmount = ethers.parseEther("1000"); // 1000 BRL
  await str.requestToMint(mintAmount);
  const balance = await realDigital.balanceOf(deployer.address);
  console.log("✅ Minted", ethers.formatEther(balance), "BRL to deployer");

  // Save deployment info
  const deploymentInfo: DeploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      realDigital: realDigitalAddress,
      addressDiscovery: addressDiscoveryAddress,
      keyDictionary: keyDictionaryAddress,
      str: strAddress
    },
    deployer: deployer.address,
    testBalance: ethers.formatEther(balance)
  };

  fs.writeFileSync('drex-deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to drex-deployment.json");

  // Summary
  console.log("\n📋 DREX Infrastructure Deployment Summary:");
  console.log("=".repeat(50));
  console.log("RealDigital (DREX):", realDigitalAddress);
  console.log("AddressDiscovery:", addressDiscoveryAddress);
  console.log("KeyDictionary:", keyDictionaryAddress);
  console.log("STR:", strAddress);
  console.log("Deployer:", deployer.address);
  console.log("Test Balance:", ethers.formatEther(balance), "BRL");
  console.log("=".repeat(50));
  console.log("🎉 DREX Infrastructure deployment completed successfully!");

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ DREX deployment failed:", error);
    process.exit(1);
  }); 