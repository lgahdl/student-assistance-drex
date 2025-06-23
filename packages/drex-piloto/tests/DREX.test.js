// /tests/DREX.test.js
// Testes básicos para os contratos do DREX simples

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DREX Piloto Simples", function () {
  let realDigital, realTokenizado, swapOneStep;
  let deployer, bankReserve, user1, user2;
  let realDigitalAddress, realTokenizadoAddress, swapOneStepAddress;

  beforeEach(async function () {
    // Obter contas de teste
    [deployer, bankReserve, user1, user2] = await ethers.getSigners();

    // Deploy do RealDigital
    const RealDigital = await ethers.getContractFactory("RealDigital");
    realDigital = await RealDigital.deploy(deployer.address);
    await realDigital.waitForDeployment();
    realDigitalAddress = await realDigital.getAddress();

    // Deploy do SwapOneStep
    const SwapOneStep = await ethers.getContractFactory("SwapOneStep");
    swapOneStep = await SwapOneStep.deploy(realDigitalAddress, deployer.address);
    await swapOneStep.waitForDeployment();
    swapOneStepAddress = await swapOneStep.getAddress();

    // Autorizar contas necessárias no RealDigital
    await realDigital.enableAccount(bankReserve.address);
    await realDigital.enableAccount(user1.address);
    await realDigital.enableAccount(user2.address);

    // Deploy do RealTokenizado
    const RealTokenizado = await ethers.getContractFactory("RealTokenizado");
    realTokenizado = await RealTokenizado.deploy(
      "Banco Teste",
      12345678,
      bankReserve.address,
      realDigitalAddress,
      deployer.address
    );
    await realTokenizado.waitForDeployment();
    realTokenizadoAddress = await realTokenizado.getAddress();

    // Autorizar contas necessárias no RealTokenizado também
    await realTokenizado.enableAccount(user1.address);
    await realTokenizado.enableAccount(user2.address);
    await realTokenizado.enableAccount(swapOneStepAddress);

    // Configurar permissões
    const MINTER_ROLE = await realTokenizado.MINTER_ROLE();
    const BURNER_ROLE = await realTokenizado.BURNER_ROLE();
    const FREEZER_ROLE = await realDigital.FREEZER_ROLE();
    const MOVER_ROLE = await realDigital.MOVER_ROLE();

    await realTokenizado.grantRole(MINTER_ROLE, swapOneStepAddress);
    await realTokenizado.grantRole(BURNER_ROLE, swapOneStepAddress);
    await realDigital.grantRole(FREEZER_ROLE, realTokenizadoAddress);
    await realDigital.grantRole(MOVER_ROLE, swapOneStepAddress);

    // Emitir alguns Real Digital para testes
    const initialAmount = ethers.parseUnits("1000", 2);
    await realDigital.mint(deployer.address, initialAmount);
    await realDigital.transfer(bankReserve.address, ethers.parseUnits("500", 2));
  });

  describe("RealDigital", function () {
    it("Deve ter as informações corretas", async function () {
      expect(await realDigital.name()).to.equal("Real Digital");
      expect(await realDigital.symbol()).to.equal("BRL");
      expect(await realDigital.decimals()).to.equal(2);
    });

    it("Deve permitir mint apenas para contas autorizadas", async function () {
      const amount = ethers.parseUnits("100", 2);
      
      // Deve funcionar para conta autorizada
      await expect(realDigital.mint(user1.address, amount))
        .to.not.be.reverted;
      
      expect(await realDigital.balanceOf(user1.address)).to.equal(amount);
    });

    it("Deve permitir congelar saldos", async function () {
      const amount = ethers.parseUnits("100", 2);
      const freezeAmount = ethers.parseUnits("30", 2);
      
      await realDigital.mint(user1.address, amount);
      await realDigital.increaseFrozenBalance(user1.address, freezeAmount);
      
      expect(await realDigital.frozenBalanceOf(user1.address)).to.equal(freezeAmount);
      expect(await realDigital.availableBalanceOf(user1.address)).to.equal(amount - freezeAmount);
    });

    it("Deve impedir transferências que excedam saldo disponível", async function () {
      const amount = ethers.parseUnits("100", 2);
      const freezeAmount = ethers.parseUnits("80", 2);
      const transferAmount = ethers.parseUnits("50", 2);
      
      await realDigital.mint(user1.address, amount);
      await realDigital.increaseFrozenBalance(user1.address, freezeAmount);
      
      // Deve falhar porque saldo disponível é apenas 20 BRL
      await expect(
        realDigital.connect(user1).transfer(user2.address, transferAmount)
      ).to.be.revertedWith("RealDigital: transfer amount exceeds available balance");
    });
  });

  describe("RealTokenizado", function () {
    it("Deve ter as informações corretas", async function () {
      expect(await realTokenizado.name()).to.equal("RealTokenizado@12345678");
      expect(await realTokenizado.symbol()).to.equal("BRL@12345678");
      expect(await realTokenizado.participant()).to.equal("Banco Teste");
      expect(await realTokenizado.cnpj8()).to.equal(12345678);
      expect(await realTokenizado.reserve()).to.equal(bankReserve.address);
    });

    it("Deve emitir tokens apenas com lastro suficiente", async function () {
      const mintAmount = ethers.parseUnits("100", 2);
      
      // Deve funcionar porque há Real Digital na reserva
      await expect(realTokenizado.mint(user1.address, mintAmount))
        .to.not.be.reverted;
      
      expect(await realTokenizado.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await realDigital.frozenBalanceOf(bankReserve.address)).to.equal(mintAmount);
    });

    it("Deve queimar tokens e liberar lastro", async function () {
      const mintAmount = ethers.parseUnits("100", 2);
      const burnAmount = ethers.parseUnits("30", 2);
      
      await realTokenizado.mint(user1.address, mintAmount);
      
      const initialFrozen = await realDigital.frozenBalanceOf(bankReserve.address);
      
      await realTokenizado.connect(user1).burn(burnAmount);
      
      expect(await realTokenizado.balanceOf(user1.address)).to.equal(mintAmount - burnAmount);
      expect(await realDigital.frozenBalanceOf(bankReserve.address)).to.equal(initialFrozen - burnAmount);
    });

    it("Deve verificar se está totalmente lastreado", async function () {
      const mintAmount = ethers.parseUnits("100", 2);
      
      await realTokenizado.mint(user1.address, mintAmount);
      
      expect(await realTokenizado.isFullyBacked()).to.be.true;
    });
  });

  describe("SwapOneStep", function () {
    beforeEach(async function () {
      // Preparar alguns tokens para testes de swap
      await realDigital.mint(user1.address, ethers.parseUnits("200", 2));
      await realTokenizado.mint(user2.address, ethers.parseUnits("100", 2));
    });

    it("Deve executar swap de Real Digital para Real Tokenizado", async function () {
      const swapAmount = ethers.parseUnits("50", 2);
      
      // Aprovar o swap para usar os tokens do user1
      await realDigital.connect(user1).approve(swapOneStepAddress, swapAmount);
      
      const initialRDBalance = await realDigital.balanceOf(user1.address);
      const initialRTBalance = await realTokenizado.balanceOf(user1.address);
      
      await swapOneStep.connect(user1).swapRealDigitalToTokenized(
        realTokenizadoAddress,
        user1.address,
        swapAmount
      );
      
      expect(await realDigital.balanceOf(user1.address)).to.equal(initialRDBalance - swapAmount);
      expect(await realTokenizado.balanceOf(user1.address)).to.equal(initialRTBalance + swapAmount);
    });

    it("Deve executar swap de Real Tokenizado para Real Digital", async function () {
      const swapAmount = ethers.parseUnits("30", 2);
      
      // Aprovar o swap para usar os tokens do user2
      await realTokenizado.connect(user2).approve(swapOneStepAddress, swapAmount);
      
      const initialRTBalance = await realTokenizado.balanceOf(user2.address);
      const initialRDBalance = await realDigital.balanceOf(user2.address);
      
      await swapOneStep.connect(user2).swapTokenizedToRealDigital(
        realTokenizadoAddress,
        user2.address,
        swapAmount
      );
      
      expect(await realTokenizado.balanceOf(user2.address)).to.equal(initialRTBalance - swapAmount);
      expect(await realDigital.balanceOf(user2.address)).to.equal(initialRDBalance + swapAmount);
    });

    it("Deve verificar se swap é possível", async function () {
      const swapAmount = ethers.parseUnits("50", 2);
      
      const [possible, reason] = await swapOneStep.canSwap(
        user1.address,
        ethers.ZeroAddress, // Real Digital
        realTokenizadoAddress, // Real Tokenizado
        swapAmount
      );
      
      expect(possible).to.be.true;
      expect(reason).to.equal("Swap possible");
    });
  });

  describe("Integração completa", function () {
    it("Deve executar um fluxo completo de operações DREX", async function () {
      console.log("\n🧪 Testando fluxo completo do DREX...");
      
      // 1. Banco Central emite Real Digital
      const bcAmount = ethers.parseUnits("1000", 2);
      await realDigital.mint(deployer.address, bcAmount);
      console.log(`   ✅ BC emitiu ${ethers.formatUnits(bcAmount, 2)} BRL`);
      
      // 2. BC transfere para reserva do banco
      const reserveAmount = ethers.parseUnits("500", 2);
      await realDigital.transfer(bankReserve.address, reserveAmount);
      console.log(`   ✅ BC transferiu ${ethers.formatUnits(reserveAmount, 2)} BRL para reserva`);
      
      // 3. Banco emite Real Tokenizado para cliente
      const clientAmount = ethers.parseUnits("200", 2);
      await realTokenizado.mint(user1.address, clientAmount);
      console.log(`   ✅ Banco emitiu ${ethers.formatUnits(clientAmount, 2)} BRL@12345678 para cliente`);
      
      // 4. Cliente faz swap de Real Tokenizado para Real Digital
      const swapAmount = ethers.parseUnits("100", 2);
      await realTokenizado.connect(user1).approve(swapOneStepAddress, swapAmount);
      await swapOneStep.connect(user1).swapTokenizedToRealDigital(
        realTokenizadoAddress,
        user1.address,
        swapAmount
      );
      console.log(`   ✅ Cliente trocou ${ethers.formatUnits(swapAmount, 2)} BRL@12345678 por BRL`);
      
      // 5. Verificar saldos finais
      const finalRDBalance = await realDigital.balanceOf(user1.address);
      const finalRTBalance = await realTokenizado.balanceOf(user1.address);
      
      expect(finalRDBalance).to.equal(swapAmount);
      expect(finalRTBalance).to.equal(clientAmount - swapAmount);
      
      console.log(`   📊 Saldo final cliente: ${ethers.formatUnits(finalRDBalance, 2)} BRL + ${ethers.formatUnits(finalRTBalance, 2)} BRL@12345678`);
      console.log("   🎉 Fluxo completo executado com sucesso!");
    });
  });
}); 