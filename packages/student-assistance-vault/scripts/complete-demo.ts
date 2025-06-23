import { ethers } from "ethers";

async function main(): Promise<void> {
  console.log("🚀 Complete DREX Student Transfer Demo");
  console.log("=" .repeat(60));
  
  // Configuração
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  const deployerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  // João Silva é a terceira conta do Hardhat (index 2) - 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
  const joaoPrivateKey = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
  
  const deployerWallet = new ethers.Wallet(deployerPrivateKey, provider);
  const joaoWallet = new ethers.Wallet(joaoPrivateKey, provider);
  
  // Verificar se o endereço do João corresponde ao registrado
  const expectedJoaoAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
  if (joaoWallet.address !== expectedJoaoAddress) {
    throw new Error(`João's address mismatch! Expected: ${expectedJoaoAddress}, Got: ${joaoWallet.address}`);
  }
  
  // Endereços dos contratos (do deployment)
  const drexTokenAddress = "0xc582Bc0317dbb0908203541971a358c44b1F3766";
  const vaultAddress = "0x26B862f640357268Bd2d9E95bc81553a2Aa81D7E";
  const recipientAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  
  console.log("📋 Addresses:");
  console.log("DREX Token:", drexTokenAddress);
  console.log("Vault:", vaultAddress);
  console.log("João Silva:", joaoWallet.address);
  console.log("Recipient:", recipientAddress);
  
  // Conectar aos contratos
  const drexToken = new ethers.Contract(
    drexTokenAddress,
    [
      "function mint(address to, uint256 amount)", 
      "function transfer(address to, uint256 amount)", 
      "function approve(address spender, uint256 amount)",
      "function balanceOf(address account) view returns (uint256)"
    ],
    deployerWallet
  );
  
  const vault = new ethers.Contract(
    vaultAddress,
    [
      "function depositDrex(uint256 amount)",
      "function distributeMonthlyAllowances()",
      "function getStudentBalance(address student) view returns (uint256)",
      "function transfer(address to, uint256 amount)"
    ],
    deployerWallet
  );
  
  // Passo 1: Mintar DREX para o deployer
  console.log("\n💰 Step 1: Minting DREX...");
  const mintAmount = ethers.parseEther("3000");
  const mintTx = await drexToken.mint(deployerWallet.address, mintAmount);
  await mintTx.wait();
  console.log("✅ Minted", ethers.formatEther(mintAmount), "DREX");
  
  // Passo 2: Aprovar e depositar DREX no vault
  console.log("\n🏦 Step 2: Funding Vault...");
  const fundAmount = ethers.parseEther("2000");
  
  // Aprovar
  const approveTx = await drexToken.approve(vaultAddress, fundAmount);
  await approveTx.wait();
  console.log("✅ Approved", ethers.formatEther(fundAmount), "DREX");
  
  // Depositar
  const depositTx = await vault.depositDrex(fundAmount);
  await depositTx.wait();
  console.log("✅ Deposited", ethers.formatEther(fundAmount), "DREX to vault");
  
  // Passo 3: Distribuir allowances
  console.log("\n📦 Step 3: Distributing Allowances...");
  const distributeTx = await vault.distributeMonthlyAllowances();
  await distributeTx.wait();
  console.log("✅ Monthly allowances distributed");
  
  // Verificar saldo do João
  const joaoBalance = await vault.getStudentBalance(joaoWallet.address);
  console.log("João's Balance:", ethers.formatEther(joaoBalance), "DREX");
  
  // Passo 4: Transferência via curl (simulada aqui, mas mostrando como fazer)
  console.log("\n💸 Step 4: Student Transfer via Private Key...");
  
  const transferAmount = ethers.parseEther("100");
  const vaultAsJoao = vault.connect(joaoWallet);
  
  // Verificar saldo do recipient antes
  const recipientBalanceBefore = await drexToken.balanceOf(recipientAddress);
  console.log("Recipient balance before:", ethers.formatEther(recipientBalanceBefore), "DREX");
  
  // Fazer a transferência
  const transferTx = await (vaultAsJoao as any).transfer(recipientAddress, transferAmount);
  const receipt = await transferTx.wait();
  
  console.log("✅ Transfer completed!");
  console.log("Transaction Hash:", receipt!.hash);
  console.log("Gas Used:", receipt!.gasUsed.toString());
  console.log("Gas Price:", receipt!.gasPrice?.toString() || "0", "(zeroBaseFee)");
  
  // Verificar saldos finais
  const joaoBalanceAfter = await vault.getStudentBalance(joaoWallet.address);
  const recipientBalanceAfter = await drexToken.balanceOf(recipientAddress);
  
  console.log("\n📊 Final Balances:");
  console.log("João's Balance:", ethers.formatEther(joaoBalanceAfter), "DREX");
  console.log("Recipient Balance:", ethers.formatEther(recipientBalanceAfter), "DREX");
  console.log("Transfer Amount:", ethers.formatEther(transferAmount), "DREX");
  
  // Mostrar como fazer via curl
  console.log("\n🔧 CURL Command for same transfer:");
  console.log("This demonstrates how a student can transfer using their private key via curl:");
  
  const iface = new ethers.Interface(["function transfer(address to, uint256 amount)"]);
  const data = iface.encodeFunctionData("transfer", [recipientAddress, transferAmount]);
  const nonce = await provider.getTransactionCount(joaoWallet.address);
  
  const tx = {
    to: vaultAddress,
    data: data,
    nonce: nonce,
    gasLimit: 100000,
    gasPrice: 0, // zeroBaseFee
    chainId: 1337
  };
  
  const signedTx = await joaoWallet.signTransaction(tx);
  
  console.log("\ncurl -X POST -H \"Content-Type: application/json\" \\");
  console.log("  --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_sendRawTransaction\",\"params\":[\"" + signedTx + "\"],\"id\":1}' \\");
  console.log("  http://localhost:8545");
  
  console.log("\n=" .repeat(60));
  console.log("🎉 Demo completed successfully!");
  console.log("✅ DREX minted and vault funded");
  console.log("✅ Allowances distributed to students");
  console.log("✅ Student transfer completed using private key");
  console.log("✅ ZeroBaseFee confirmed (no ETH needed for gas)");
  console.log("✅ CURL command generated for external use");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  }); 