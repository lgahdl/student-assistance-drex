// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title StudentAssistanceVault
 * @dev Vault contract for managing DREX student assistance funds
 * @notice This contract acts as a custodial vault that receives DREX from any address
 *         and distributes it to registered students according to their monthly allowances
 */
contract StudentAssistanceVault is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ CONSTANTS ============
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant STAFF_ROLE = keccak256("STAFF_ROLE");
    
    /// @dev Maximum number of students to prevent unbounded gas costs
    uint256 public constant MAX_STUDENTS = 1000;
    
    /// @dev Maximum batch size for distribution to prevent gas limit issues
    uint256 public constant MAX_BATCH_SIZE = 50;

    // ============ STRUCTS ============
    
    struct Student {
        address studentAddress;
        uint256 monthlyAmount;
        bool isActive;
        uint256 registeredAt;
    }

    // ============ STATE VARIABLES ============
    
    /// @dev DREX token contract
    IERC20 public immutable drexToken;
    
    /// @dev Mapping from student address to student info
    mapping(address => Student) public students;
    
    /// @dev Mapping from student address to current balance
    mapping(address => uint256) public balances;
    
    /// @dev Array of all student addresses for iteration
    address[] public studentAddresses;
    
    /// @dev Total amount expected to be distributed monthly
    uint256 public totalExpectedAmount;
    
    /// @dev Total amount distributed in current period
    uint256 public totalDistributedAmount;
    
    /// @dev Last distribution timestamp
    uint256 public lastDistributionTimestamp;

    // ============ EVENTS ============
    
    event StudentRegistered(
        address indexed student, 
        uint256 monthlyAmount, 
        uint256 timestamp
    );
    
    event StudentUpdated(
        address indexed student, 
        uint256 oldAmount, 
        uint256 newAmount, 
        uint256 timestamp
    );
    
    event StudentRemoved(
        address indexed student, 
        uint256 timestamp
    );
    
    event MonthlyDistribution(
        uint256 totalAmount, 
        uint256 studentsCount, 
        uint256 timestamp
    );
    
    event BatchDistribution(
        uint256 startIndex, 
        uint256 endIndex, 
        uint256 amount, 
        uint256 timestamp
    );
    
    event Transfer(
        address indexed from, 
        address indexed to, 
        uint256 amount, 
        uint256 timestamp
    );
    
    event DrexDeposited(
        address indexed from, 
        uint256 amount, 
        uint256 timestamp
    );
    
    event EmergencyWithdraw(
        address indexed admin, 
        uint256 amount, 
        uint256 timestamp
    );
    
    event StaffRoleGranted(
        address indexed account, 
        address indexed admin, 
        uint256 timestamp
    );
    
    event StaffRoleRevoked(
        address indexed account, 
        address indexed admin, 
        uint256 timestamp
    );

    // ============ MODIFIERS ============
    
    modifier onlyAdminOrStaff() {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || hasRole(STAFF_ROLE, msg.sender),
            "StudentAssistanceVault: caller must have ADMIN or STAFF role"
        );
        _;
    }
    
    modifier onlyRegisteredStudent() {
        require(isStudent(msg.sender), "StudentAssistanceVault: caller is not a registered student");
        _;
    }
    
    modifier validAddress(address _address) {
        require(_address != address(0), "StudentAssistanceVault: invalid address");
        _;
    }
    
    modifier validAmount(uint256 _amount) {
        require(_amount > 0, "StudentAssistanceVault: amount must be greater than zero");
        _;
    }

    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Constructor sets the DREX token and initial administrator
     * @param _drexToken Address of the DREX ERC20 token contract
     * @param _administrator Address that will receive ADMIN_ROLE
     */
    constructor(
        address _drexToken,
        address _administrator
    ) validAddress(_drexToken) validAddress(_administrator) {
        drexToken = IERC20(_drexToken);
        
        // Grant admin role to the administrator
        _grantRole(DEFAULT_ADMIN_ROLE, _administrator);
        _grantRole(ADMIN_ROLE, _administrator);
        
        lastDistributionTimestamp = block.timestamp;
    }

    // ============ RECEIVE FUNCTION ============
    
    /**
     * @dev Receive function to accept DREX deposits via direct transfer
     * @notice Only accepts exact amount equal to totalExpectedAmount
     */
    receive() external payable {
        revert("StudentAssistanceVault: use depositDrex function for DREX deposits");
    }

    // ============ DEPOSIT FUNCTIONS ============
    
    /**
     * @dev Deposit DREX tokens to the vault
     * @param amount Amount of DREX to deposit
     * @notice Accepts any amount of DREX for funding the vault
     */
    function depositDrex(uint256 amount) 
        external 
        validAmount(amount) 
        nonReentrant 
    {
        drexToken.safeTransferFrom(msg.sender, address(this), amount);
        
        emit DrexDeposited(msg.sender, amount, block.timestamp);
    }

    // ============ STUDENT MANAGEMENT FUNCTIONS ============
    
    /**
     * @dev Register a new student
     * @param studentAddress Address of the student
     * @param monthlyAmount Monthly allowance amount for the student
     */
    function registerStudent(
        address studentAddress,
        uint256 monthlyAmount
    ) 
        external 
        onlyAdminOrStaff 
        validAddress(studentAddress) 
        validAmount(monthlyAmount) 
    {
        require(!isStudent(studentAddress), "StudentAssistanceVault: student already registered");
        require(studentAddresses.length < MAX_STUDENTS, "StudentAssistanceVault: maximum students reached");
        
        // Create student struct
        students[studentAddress] = Student({
            studentAddress: studentAddress,
            monthlyAmount: monthlyAmount,
            isActive: true,
            registeredAt: block.timestamp
        });
        
        // Add to array for iteration
        studentAddresses.push(studentAddress);
        
        // Update total expected amount
        totalExpectedAmount += monthlyAmount;
        
        // Initialize balance to zero
        balances[studentAddress] = 0;
        
        emit StudentRegistered(studentAddress, monthlyAmount, block.timestamp);
    }
    
    /**
     * @dev Update a student's monthly amount
     * @param studentAddress Address of the student
     * @param newAmount New monthly allowance amount
     */
    function updateStudentAmount(
        address studentAddress,
        uint256 newAmount
    ) 
        external 
        onlyAdminOrStaff 
        validAddress(studentAddress) 
        validAmount(newAmount) 
    {
        require(isStudent(studentAddress), "StudentAssistanceVault: student not registered");
        
        Student storage student = students[studentAddress];
        uint256 oldAmount = student.monthlyAmount;
        
        // Update total expected amount
        totalExpectedAmount = totalExpectedAmount - oldAmount + newAmount;
        
        // Update student amount
        student.monthlyAmount = newAmount;
        
        emit StudentUpdated(studentAddress, oldAmount, newAmount, block.timestamp);
    }
    
    /**
     * @dev Remove a student from the system
     * @param studentAddress Address of the student to remove
     */
    function removeStudent(address studentAddress) 
        external 
        onlyAdminOrStaff 
        validAddress(studentAddress) 
    {
        require(isStudent(studentAddress), "StudentAssistanceVault: student not registered");
        
        Student storage student = students[studentAddress];
        uint256 monthlyAmount = student.monthlyAmount;
        
        // Update total expected amount
        totalExpectedAmount -= monthlyAmount;
        
        // Mark as inactive
        student.isActive = false;
        
        // Remove from array (swap with last element and pop)
        for (uint256 i = 0; i < studentAddresses.length; i++) {
            if (studentAddresses[i] == studentAddress) {
                studentAddresses[i] = studentAddresses[studentAddresses.length - 1];
                studentAddresses.pop();
                break;
            }
        }
        
        // Delete student data
        delete students[studentAddress];
        
        emit StudentRemoved(studentAddress, block.timestamp);
    }

    // ============ DISTRIBUTION FUNCTIONS ============
    
    /**
     * @dev Distribute monthly allowances to all students
     * @notice This function can be expensive for large numbers of students
     */
    function distributeMonthlyAllowances() external onlyRole(ADMIN_ROLE) nonReentrant {
        require(studentAddresses.length > 0, "StudentAssistanceVault: no students registered");
        require(
            drexToken.balanceOf(address(this)) >= totalExpectedAmount,
            "StudentAssistanceVault: insufficient contract balance"
        );
        
        uint256 distributedAmount = 0;
        
        for (uint256 i = 0; i < studentAddresses.length; i++) {
            address studentAddr = studentAddresses[i];
            Student storage student = students[studentAddr];
            
            if (student.isActive) {
                balances[studentAddr] += student.monthlyAmount;
                distributedAmount += student.monthlyAmount;
            }
        }
        
        totalDistributedAmount += distributedAmount;
        lastDistributionTimestamp = block.timestamp;
        
        emit MonthlyDistribution(distributedAmount, studentAddresses.length, block.timestamp);
    }
    
    /**
     * @dev Distribute allowances to a batch of students
     * @param startIndex Starting index in the studentAddresses array
     * @param endIndex Ending index in the studentAddresses array (exclusive)
     */
    function distributeBatch(
        uint256 startIndex,
        uint256 endIndex
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(startIndex < endIndex, "StudentAssistanceVault: invalid batch range");
        require(endIndex <= studentAddresses.length, "StudentAssistanceVault: end index out of bounds");
        require(
            endIndex - startIndex <= MAX_BATCH_SIZE,
            "StudentAssistanceVault: batch size too large"
        );
        
        uint256 batchAmount = 0;
        
        for (uint256 i = startIndex; i < endIndex; i++) {
            address studentAddr = studentAddresses[i];
            Student storage student = students[studentAddr];
            
            if (student.isActive) {
                balances[studentAddr] += student.monthlyAmount;
                batchAmount += student.monthlyAmount;
            }
        }
        
        require(
            drexToken.balanceOf(address(this)) >= batchAmount,
            "StudentAssistanceVault: insufficient contract balance for batch"
        );
        
        totalDistributedAmount += batchAmount;
        
        emit BatchDistribution(startIndex, endIndex, batchAmount, block.timestamp);
    }

    // ============ TRANSFER FUNCTIONS ============
    
    /**
     * @dev Transfer DREX from student's balance to any address
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function transfer(
        address to,
        uint256 amount
    ) 
        external 
        onlyRegisteredStudent 
        validAddress(to) 
        validAmount(amount) 
        nonReentrant 
    {
        require(balances[msg.sender] >= amount, "StudentAssistanceVault: insufficient balance");
        
        // Update student balance
        balances[msg.sender] -= amount;
        
        // Transfer DREX from contract to recipient
        drexToken.safeTransfer(to, amount);
        
        emit Transfer(msg.sender, to, amount, block.timestamp);
    }

    // ============ EMERGENCY FUNCTIONS ============
    
    /**
     * @dev Emergency withdraw function for admin only
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) 
        external 
        onlyRole(ADMIN_ROLE) 
        validAmount(amount) 
        nonReentrant 
    {
        require(
            drexToken.balanceOf(address(this)) >= amount,
            "StudentAssistanceVault: insufficient contract balance"
        );
        
        drexToken.safeTransfer(msg.sender, amount);
        
        emit EmergencyWithdraw(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Withdraw all DREX from the contract
     */
    function withdrawAll() external onlyRole(ADMIN_ROLE) nonReentrant {
        uint256 balance = drexToken.balanceOf(address(this));
        require(balance > 0, "StudentAssistanceVault: no balance to withdraw");
        
        drexToken.safeTransfer(msg.sender, balance);
        
        emit EmergencyWithdraw(msg.sender, balance, block.timestamp);
    }

    // ============ ROLE MANAGEMENT FUNCTIONS ============
    
    /**
     * @dev Grant STAFF_ROLE to an address
     * @param account Address to grant the role to
     */
    function grantStaffRole(address account) 
        external 
        onlyRole(ADMIN_ROLE) 
        validAddress(account) 
    {
        grantRole(STAFF_ROLE, account);
        emit StaffRoleGranted(account, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Revoke STAFF_ROLE from an address
     * @param account Address to revoke the role from
     */
    function revokeStaffRole(address account) 
        external 
        onlyRole(ADMIN_ROLE) 
        validAddress(account) 
    {
        revokeRole(STAFF_ROLE, account);
        emit StaffRoleRevoked(account, msg.sender, block.timestamp);
    }

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get student balance
     * @param student Student address
     * @return Student's current balance
     */
    function getStudentBalance(address student) external view returns (uint256) {
        return balances[student];
    }
    
    /**
     * @dev Get student information
     * @param student Student address
     * @return Student struct
     */
    function getStudentInfo(address student) external view returns (Student memory) {
        return students[student];
    }
    
    /**
     * @dev Get total expected amount for all students
     * @return Total monthly amount expected
     */
    function getTotalExpectedAmount() external view returns (uint256) {
        return totalExpectedAmount;
    }
    
    /**
     * @dev Get total distributed amount
     * @return Total amount distributed so far
     */
    function getTotalDistributedAmount() external view returns (uint256) {
        return totalDistributedAmount;
    }
    
    /**
     * @dev Get contract's DREX balance
     * @return Current DREX balance of the contract
     */
    function getContractBalance() external view returns (uint256) {
        return drexToken.balanceOf(address(this));
    }
    
    /**
     * @dev Get number of registered students
     * @return Number of students
     */
    function getStudentCount() external view returns (uint256) {
        return studentAddresses.length;
    }
    
    /**
     * @dev Get student address at specific index
     * @param index Index in the studentAddresses array
     * @return Student address
     */
    function getStudentAtIndex(uint256 index) external view returns (address) {
        require(index < studentAddresses.length, "StudentAssistanceVault: index out of bounds");
        return studentAddresses[index];
    }
    
    /**
     * @dev Check if an address is a registered student
     * @param account Address to check
     * @return True if the address is a registered student
     */
    function isStudent(address account) public view returns (bool) {
        return students[account].isActive;
    }
    
    /**
     * @dev Get all student addresses
     * @return Array of all student addresses
     */
    function getAllStudents() external view returns (address[] memory) {
        return studentAddresses;
    }
    
    /**
     * @dev Get batch information for distribution planning
     * @return totalStudents Total number of students
     * @return maxBatchSize Maximum recommended batch size
     * @return estimatedBatches Number of batches needed for full distribution
     */
    function getBatchInfo() external view returns (
        uint256 totalStudents,
        uint256 maxBatchSize,
        uint256 estimatedBatches
    ) {
        totalStudents = studentAddresses.length;
        maxBatchSize = MAX_BATCH_SIZE;
        estimatedBatches = (totalStudents + MAX_BATCH_SIZE - 1) / MAX_BATCH_SIZE; // Ceiling division
    }
} 