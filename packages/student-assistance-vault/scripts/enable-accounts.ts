import { ethers } from "ethers";
import fs from "fs";
import path from "path";

async function main(): Promise<void> {
  console.log("🔓 Enabling DREX Accounts for Student Assistance Vault");
  console.log("=" .repeat(60));
  
  // Configuração
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  const deployerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const deployerWallet = new ethers.Wallet(deployerPrivateKey, provider);
  
  // Ler informações de deployment
  const drexDeploymentPath = path.join(__dirname, "../../drex-piloto/drex-deployment.json");
  const vaultDeploymentPath = path.join(__dirname, "..", "vault-deployment.json");
  
  let drexDeployment, vaultDeployment;
  try {
    const drexData = fs.readFileSync(drexDeploymentPath, 'utf8');
    drexDeployment = JSON.parse(drexData);
    
    const vaultData = fs.readFileSync(vaultDeploymentPath, 'utf8');
    vaultDeployment = JSON.parse(vaultData);
  } catch (error) {
    console.error("❌ Could not read deployment files:", error);
    throw error;
  }
  
  const drexTokenAddress = drexDeployment.contracts.realDigital;
  const vaultAddress = vaultDeployment.contracts.StudentAssistanceVault;
  
  console.log("📋 Addresses:");
  console.log("DREX Token:", drexTokenAddress);
  console.log("Vault:", vaultAddress);
  console.log("Deployer:", deployerWallet.address);
  
  // Conectar ao contrato DREX
  const drexToken = new ethers.Contract(
    drexTokenAddress,
    [
      "function enableAccount(address member)",
      "function verifyAccount(address account) view returns (bool)",
      "function hasRole(bytes32 role, address account) view returns (bool)",
      "function ACCESS_ROLE() view returns (bytes32)"
    ],
    deployerWallet
  );
  
  // Contas para habilitar
  const accountsToEnable = [
    { name: "Vault Contract", address: vaultAddress },
    { name: "João Silva", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" },
    { name: "Maria Santos", address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" },
    { name: "Pedro Costa", address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" },
    { name: "Recipient (Test)", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" }
  ];
  
  // Verificar se o deployer tem permissão
  const ACCESS_ROLE = await drexToken.ACCESS_ROLE();
  const hasAccessRole = await drexToken.hasRole(ACCESS_ROLE, deployerWallet.address);
  const isDeployerEnabled = await drexToken.verifyAccount(deployerWallet.address);
  
  console.log("\n🔍 Deployer Permissions:");
  console.log("Has ACCESS_ROLE:", hasAccessRole);
  console.log("Account Enabled:", isDeployerEnabled);
  
  if (!hasAccessRole) {
    throw new Error("Deployer does not have ACCESS_ROLE to enable accounts");
  }
  
  // Habilitar contas
  console.log("\n🔓 Enabling Accounts:");
  
  for (const account of accountsToEnable) {
    console.log(`\nChecking ${account.name} (${account.address})...`);
    
    const isEnabled = await drexToken.verifyAccount(account.address);
    if (isEnabled) {
      console.log(`✅ ${account.name} is already enabled`);
      continue;
    }
    
    console.log(`🔄 Enabling ${account.name}...`);
    const tx = await drexToken.enableAccount(account.address);
    await tx.wait();
    
    const isEnabledAfter = await drexToken.verifyAccount(account.address);
    if (isEnabledAfter) {
      console.log(`✅ ${account.name} enabled successfully`);
    } else {
      console.log(`❌ Failed to enable ${account.name}`);
    }
  }
  
  // Verificação final
  console.log("\n📊 Final Status:");
  for (const account of accountsToEnable) {
    const isEnabled = await drexToken.verifyAccount(account.address);
    console.log(`${account.name}: ${isEnabled ? '✅ Enabled' : '❌ Disabled'}`);
  }
  
  console.log("\n=" .repeat(60));
  console.log("🎉 Account enabling completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error("❌ Account enabling failed:", error);
    process.exit(1);
  }); 