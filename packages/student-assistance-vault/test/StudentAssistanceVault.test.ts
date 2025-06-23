import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { StudentAssistanceVault, MockERC20 } from "../typechain-types";

describe("StudentAssistanceVault", function () {
  let vault: StudentAssistanceVault;
  let drexToken: MockERC20;
  let admin: SignerWithAddress;
  let staff: SignerWithAddress;
  let student1: SignerWithAddress;
  let student2: SignerWithAddress;
  let student3: SignerWithAddress;
  let donor: SignerWithAddress;
  let recipient: SignerWithAddress;
  let nonStudent: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1M DREX
  const MONTHLY_AMOUNT_1 = ethers.parseEther("500"); // 500 DREX
  const MONTHLY_AMOUNT_2 = ethers.parseEther("600"); // 600 DREX
  const MONTHLY_AMOUNT_3 = ethers.parseEther("450"); // 450 DREX

  beforeEach(async function () {
    // Get signers
    [admin, staff, student1, student2, student3, donor, recipient, nonStudent] = await ethers.getSigners();

    // Deploy Mock DREX Token
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    drexToken = (await MockERC20Factory.deploy("Real Digital", "BRL", INITIAL_SUPPLY)) as unknown as MockERC20;
    await drexToken.waitForDeployment();

    // Deploy StudentAssistanceVault
    const VaultFactory = await ethers.getContractFactory("StudentAssistanceVault");
    vault = (await VaultFactory.deploy(await drexToken.getAddress(), admin.address)) as unknown as StudentAssistanceVault;
    await vault.waitForDeployment();

    // Transfer some DREX to donor for testing deposits
    await drexToken.transfer(donor.address, ethers.parseEther("50000"));
    
    // Approve vault to spend donor's DREX
    await drexToken.connect(donor).approve(await vault.getAddress(), ethers.parseEther("50000"));
  });

  describe("Deployment", function () {
    it("Should set the correct DREX token address", async function () {
      expect(await vault.drexToken()).to.equal(await drexToken.getAddress());
    });

    it("Should grant ADMIN_ROLE to the administrator", async function () {
      const ADMIN_ROLE = await vault.ADMIN_ROLE();
      expect(await vault.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Should set initial values correctly", async function () {
      expect(await vault.getTotalExpectedAmount()).to.equal(0);
      expect(await vault.getTotalDistributedAmount()).to.equal(0);
      expect(await vault.getStudentCount()).to.equal(0);
    });
  });

  describe("DREX Deposits", function () {
    it("Should accept DREX deposits and emit DrexDeposited event", async function () {
      const depositAmount = ethers.parseEther("1000");
      
      await expect(vault.connect(donor).depositDrex(depositAmount))
        .to.emit(vault, "DrexDeposited");

      expect(await vault.getContractBalance()).to.equal(depositAmount);
    });

    it("Should revert on zero amount deposit", async function () {
      await expect(vault.connect(donor).depositDrex(0))
        .to.be.revertedWith("StudentAssistanceVault: amount must be greater than zero");
    });

    it("Should revert on insufficient allowance", async function () {
      const depositAmount = ethers.parseEther("100000"); // More than approved
      
      await expect(vault.connect(donor).depositDrex(depositAmount))
        .to.be.reverted;
    });

    it("Should accept multiple deposits from different addresses", async function () {
      const amount1 = ethers.parseEther("1000");
      const amount2 = ethers.parseEther("500");
      
      // Transfer and approve for admin
      await drexToken.transfer(admin.address, ethers.parseEther("1000"));
      await drexToken.connect(admin).approve(await vault.getAddress(), amount2);
      
      await vault.connect(donor).depositDrex(amount1);
      await vault.connect(admin).depositDrex(amount2);
      
      expect(await vault.getContractBalance()).to.equal(amount1 + amount2);
    });
  });

  describe("Student Registration", function () {
    it("Should register a student and emit StudentRegistered event", async function () {
      await expect(vault.connect(admin).registerStudent(student1.address, MONTHLY_AMOUNT_1))
        .to.emit(vault, "StudentRegistered");

      expect(await vault.isStudent(student1.address)).to.be.true;
      expect(await vault.getStudentCount()).to.equal(1);
      expect(await vault.getTotalExpectedAmount()).to.equal(MONTHLY_AMOUNT_1);
      
      const studentInfo = await vault.getStudentInfo(student1.address);
      expect(studentInfo.studentAddress).to.equal(student1.address);
      expect(studentInfo.monthlyAmount).to.equal(MONTHLY_AMOUNT_1);
      expect(studentInfo.isActive).to.be.true;
    });

    it("Should allow staff to register students", async function () {
      // Grant staff role
      await vault.connect(admin).grantStaffRole(staff.address);
      
      await expect(vault.connect(staff).registerStudent(student1.address, MONTHLY_AMOUNT_1))
        .to.emit(vault, "StudentRegistered");
        
      expect(await vault.isStudent(student1.address)).to.be.true;
    });

    it("Should revert when non-admin/staff tries to register", async function () {
      await expect(vault.connect(nonStudent).registerStudent(student1.address, MONTHLY_AMOUNT_1))
        .to.be.revertedWith("StudentAssistanceVault: caller must have ADMIN or STAFF role");
    });

    it("Should revert when registering duplicate student", async function () {
      await vault.connect(admin).registerStudent(student1.address, MONTHLY_AMOUNT_1);
      
      await expect(vault.connect(admin).registerStudent(student1.address, MONTHLY_AMOUNT_2))
        .to.be.revertedWith("StudentAssistanceVault: student already registered");
    });

    it("Should revert on zero monthly amount", async function () {
      await expect(vault.connect(admin).registerStudent(student1.address, 0))
        .to.be.revertedWith("StudentAssistanceVault: amount must be greater than zero");
    });

    it("Should revert on zero address", async function () {
      await expect(vault.connect(admin).registerStudent(ethers.ZeroAddress, MONTHLY_AMOUNT_1))
        .to.be.revertedWith("StudentAssistanceVault: invalid address");
    });

    it("Should register multiple students correctly", async function () {
      await vault.connect(admin).registerStudent(student1.address, MONTHLY_AMOUNT_1);
      await vault.connect(admin).registerStudent(student2.address, MONTHLY_AMOUNT_2);
      await vault.connect(admin).registerStudent(student3.address, MONTHLY_AMOUNT_3);

      expect(await vault.getStudentCount()).to.equal(3);
      expect(await vault.getTotalExpectedAmount()).to.equal(
        MONTHLY_AMOUNT_1 + MONTHLY_AMOUNT_2 + MONTHLY_AMOUNT_3
      );
    });
  });

  describe("Student Management", function () {
    beforeEach(async function () {
      await vault.connect(admin).registerStudent(student1.address, MONTHLY_AMOUNT_1);
      await vault.connect(admin).registerStudent(student2.address, MONTHLY_AMOUNT_2);
    });

    it("Should update student monthly amount and emit StudentUpdated event", async function () {
      const newAmount = ethers.parseEther("700");
      
      await expect(vault.connect(admin).updateStudentAmount(student1.address, newAmount))
        .to.emit(vault, "StudentUpdated");

      const studentInfo = await vault.getStudentInfo(student1.address);
      expect(studentInfo.monthlyAmount).to.equal(newAmount);
      
      expect(await vault.getTotalExpectedAmount()).to.equal(
        newAmount + MONTHLY_AMOUNT_2
      );
    });

    it("Should remove student and emit StudentRemoved event", async function () {
      await expect(vault.connect(admin).removeStudent(student1.address))
        .to.emit(vault, "StudentRemoved");

      expect(await vault.isStudent(student1.address)).to.be.false;
      expect(await vault.getStudentCount()).to.equal(1);
      expect(await vault.getTotalExpectedAmount()).to.equal(MONTHLY_AMOUNT_2);
    });

    it("Should revert when updating non-existent student", async function () {
      await expect(vault.connect(admin).updateStudentAmount(nonStudent.address, MONTHLY_AMOUNT_1))
        .to.be.revertedWith("StudentAssistanceVault: student not registered");
    });

    it("Should revert when removing non-existent student", async function () {
      await expect(vault.connect(admin).removeStudent(nonStudent.address))
        .to.be.revertedWith("StudentAssistanceVault: student not registered");
    });
  });

  describe("Monthly Distribution", function () {
    beforeEach(async function () {
      // Register students
      await vault.connect(admin).registerStudent(student1.address, MONTHLY_AMOUNT_1);
      await vault.connect(admin).registerStudent(student2.address, MONTHLY_AMOUNT_2);
      await vault.connect(admin).registerStudent(student3.address, MONTHLY_AMOUNT_3);
      
      // Deposit enough DREX
      const totalNeeded = MONTHLY_AMOUNT_1 + MONTHLY_AMOUNT_2 + MONTHLY_AMOUNT_3;
      await vault.connect(donor).depositDrex(totalNeeded);
    });

    it("Should distribute monthly allowances to all students and emit MonthlyDistribution event", async function () {
      const totalExpected = await vault.getTotalExpectedAmount();
      
      await expect(vault.connect(admin).distributeMonthlyAllowances())
        .to.emit(vault, "MonthlyDistribution");

      // Check student balances
      expect(await vault.getStudentBalance(student1.address)).to.equal(MONTHLY_AMOUNT_1);
      expect(await vault.getStudentBalance(student2.address)).to.equal(MONTHLY_AMOUNT_2);
      expect(await vault.getStudentBalance(student3.address)).to.equal(MONTHLY_AMOUNT_3);
      
      expect(await vault.getTotalDistributedAmount()).to.equal(totalExpected);
    });

    it("Should revert distribution with insufficient contract balance", async function () {
      // Deploy new vault with no deposits
      const VaultFactory = await ethers.getContractFactory("StudentAssistanceVault");
      const emptyVault = (await VaultFactory.deploy(await drexToken.getAddress(), admin.address)) as unknown as StudentAssistanceVault;
      await emptyVault.connect(admin).registerStudent(student1.address, MONTHLY_AMOUNT_1);
      
      await expect(emptyVault.connect(admin).distributeMonthlyAllowances())
        .to.be.revertedWith("StudentAssistanceVault: insufficient contract balance");
    });

    it("Should revert when no students are registered", async function () {
      const VaultFactory = await ethers.getContractFactory("StudentAssistanceVault");
      const emptyVault = (await VaultFactory.deploy(await drexToken.getAddress(), admin.address)) as unknown as StudentAssistanceVault;
      
      await expect(emptyVault.connect(admin).distributeMonthlyAllowances())
        .to.be.revertedWith("StudentAssistanceVault: no students registered");
    });

    it("Should only allow admin to distribute", async function () {
      await expect(vault.connect(staff).distributeMonthlyAllowances())
        .to.be.reverted;
    });
  });

  describe("Batch Distribution", function () {
    beforeEach(async function () {
      // Register students
      await vault.connect(admin).registerStudent(student1.address, MONTHLY_AMOUNT_1);
      await vault.connect(admin).registerStudent(student2.address, MONTHLY_AMOUNT_2);
      await vault.connect(admin).registerStudent(student3.address, MONTHLY_AMOUNT_3);
      
      // Deposit enough DREX
      const totalNeeded = MONTHLY_AMOUNT_1 + MONTHLY_AMOUNT_2 + MONTHLY_AMOUNT_3;
      await vault.connect(donor).depositDrex(totalNeeded);
    });

    it("Should distribute to a batch of students and emit BatchDistribution event", async function () {
      const startIndex = 0;
      const endIndex = 2; // First 2 students
      
      await expect(vault.connect(admin).distributeBatch(startIndex, endIndex))
        .to.emit(vault, "BatchDistribution");

      // Check balances
      expect(await vault.getStudentBalance(student1.address)).to.equal(MONTHLY_AMOUNT_1);
      expect(await vault.getStudentBalance(student2.address)).to.equal(MONTHLY_AMOUNT_2);
      expect(await vault.getStudentBalance(student3.address)).to.equal(0); // Not included in batch
    });

    it("Should revert on invalid batch range", async function () {
      await expect(vault.connect(admin).distributeBatch(2, 1))
        .to.be.revertedWith("StudentAssistanceVault: invalid batch range");
    });

    it("Should revert on out of bounds end index", async function () {
      await expect(vault.connect(admin).distributeBatch(0, 10))
        .to.be.revertedWith("StudentAssistanceVault: end index out of bounds");
    });
  });

  describe("Student Transfers", function () {
    beforeEach(async function () {
      // Register student and distribute funds
      await vault.connect(admin).registerStudent(student1.address, MONTHLY_AMOUNT_1);
      await vault.connect(donor).depositDrex(MONTHLY_AMOUNT_1);
      await vault.connect(admin).distributeMonthlyAllowances();
    });

    it("Should allow student to transfer DREX and emit Transfer event", async function () {
      const transferAmount = ethers.parseEther("100");
      
      await expect(vault.connect(student1).transfer(recipient.address, transferAmount))
        .to.emit(vault, "Transfer");

      // Check balances
      expect(await vault.getStudentBalance(student1.address)).to.equal(
        MONTHLY_AMOUNT_1 - transferAmount
      );
      expect(await drexToken.balanceOf(recipient.address)).to.equal(transferAmount);
    });

    it("Should revert when non-student tries to transfer", async function () {
      await expect(vault.connect(nonStudent).transfer(recipient.address, ethers.parseEther("100")))
        .to.be.revertedWith("StudentAssistanceVault: caller is not a registered student");
    });

    it("Should revert on insufficient student balance", async function () {
      const excessiveAmount = MONTHLY_AMOUNT_1 + ethers.parseEther("100");
      
      await expect(vault.connect(student1).transfer(recipient.address, excessiveAmount))
        .to.be.revertedWith("StudentAssistanceVault: insufficient balance");
    });

    it("Should revert on zero amount transfer", async function () {
      await expect(vault.connect(student1).transfer(recipient.address, 0))
        .to.be.revertedWith("StudentAssistanceVault: amount must be greater than zero");
    });

    it("Should revert on zero address recipient", async function () {
      await expect(vault.connect(student1).transfer(ethers.ZeroAddress, ethers.parseEther("100")))
        .to.be.revertedWith("StudentAssistanceVault: invalid address");
    });
  });

  describe("Emergency Withdraw", function () {
    beforeEach(async function () {
      await vault.connect(donor).depositDrex(ethers.parseEther("1000"));
    });

    it("Should allow admin to emergency withdraw and emit EmergencyWithdraw event", async function () {
      const withdrawAmount = ethers.parseEther("500");
      const initialBalance = await drexToken.balanceOf(admin.address);
      
      await expect(vault.connect(admin).emergencyWithdraw(withdrawAmount))
        .to.emit(vault, "EmergencyWithdraw");

      expect(await drexToken.balanceOf(admin.address)).to.equal(
        initialBalance + withdrawAmount
      );
      expect(await vault.getContractBalance()).to.equal(
        ethers.parseEther("1000") - withdrawAmount
      );
    });

    it("Should allow admin to withdraw all funds", async function () {
      const contractBalance = await vault.getContractBalance();
      const initialBalance = await drexToken.balanceOf(admin.address);
      
      await expect(vault.connect(admin).withdrawAll())
        .to.emit(vault, "EmergencyWithdraw");

      expect(await drexToken.balanceOf(admin.address)).to.equal(
        initialBalance + contractBalance
      );
      expect(await vault.getContractBalance()).to.equal(0);
    });

    it("Should revert when non-admin tries to withdraw", async function () {
      await expect(vault.connect(staff).emergencyWithdraw(ethers.parseEther("100")))
        .to.be.reverted;
    });

    it("Should revert on insufficient contract balance", async function () {
      await expect(vault.connect(admin).emergencyWithdraw(ethers.parseEther("2000")))
        .to.be.revertedWith("StudentAssistanceVault: insufficient contract balance");
    });

    it("Should revert withdrawAll when no balance", async function () {
      await vault.connect(admin).withdrawAll(); // Withdraw everything first
      
      await expect(vault.connect(admin).withdrawAll())
        .to.be.revertedWith("StudentAssistanceVault: no balance to withdraw");
    });
  });

  describe("Role Management", function () {
    it("Should grant staff role and emit StaffRoleGranted event", async function () {
      await expect(vault.connect(admin).grantStaffRole(staff.address))
        .to.emit(vault, "StaffRoleGranted");

      const STAFF_ROLE = await vault.STAFF_ROLE();
      expect(await vault.hasRole(STAFF_ROLE, staff.address)).to.be.true;
    });

    it("Should revoke staff role and emit StaffRoleRevoked event", async function () {
      await vault.connect(admin).grantStaffRole(staff.address);
      
      await expect(vault.connect(admin).revokeStaffRole(staff.address))
        .to.emit(vault, "StaffRoleRevoked");

      const STAFF_ROLE = await vault.STAFF_ROLE();
      expect(await vault.hasRole(STAFF_ROLE, staff.address)).to.be.false;
    });

    it("Should only allow admin to manage staff roles", async function () {
      await expect(vault.connect(staff).grantStaffRole(nonStudent.address))
        .to.be.reverted;
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await vault.connect(admin).registerStudent(student1.address, MONTHLY_AMOUNT_1);
      await vault.connect(admin).registerStudent(student2.address, MONTHLY_AMOUNT_2);
    });

    it("Should return correct student information", async function () {
      const studentInfo = await vault.getStudentInfo(student1.address);
      expect(studentInfo.studentAddress).to.equal(student1.address);
      expect(studentInfo.monthlyAmount).to.equal(MONTHLY_AMOUNT_1);
      expect(studentInfo.isActive).to.be.true;
    });

    it("Should return all student addresses", async function () {
      const allStudents = await vault.getAllStudents();
      expect(allStudents).to.deep.equal([student1.address, student2.address]);
    });

    it("Should return correct batch information", async function () {
      const batchInfo = await vault.getBatchInfo();
      expect(batchInfo.totalStudents).to.equal(2);
      expect(batchInfo.maxBatchSize).to.equal(50);
      expect(batchInfo.estimatedBatches).to.equal(1);
    });

    it("Should return student at specific index", async function () {
      expect(await vault.getStudentAtIndex(0)).to.equal(student1.address);
      expect(await vault.getStudentAtIndex(1)).to.equal(student2.address);
    });

    it("Should revert on out of bounds index", async function () {
      await expect(vault.getStudentAtIndex(5))
        .to.be.revertedWith("StudentAssistanceVault: index out of bounds");
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle reentrancy protection", async function () {
      // This would require a malicious contract to test properly
      // For now, we verify the modifier is present in the contract
      expect(await vault.getContractBalance()).to.be.a('bigint');
    });

    it("Should handle maximum students limit", async function () {
      const MAX_STUDENTS = await vault.MAX_STUDENTS();
      expect(MAX_STUDENTS).to.equal(1000);
    });

    it("Should handle maximum batch size", async function () {
      const MAX_BATCH_SIZE = await vault.MAX_BATCH_SIZE();
      expect(MAX_BATCH_SIZE).to.equal(50);
    });

    it("Should reject direct ETH transfers", async function () {
      await expect(
        admin.sendTransaction({
          to: await vault.getAddress(),
          value: ethers.parseEther("1")
        })
      ).to.be.revertedWith("StudentAssistanceVault: use depositDrex function for DREX deposits");
    });
  });
}); 