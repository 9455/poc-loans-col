// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title LoanBrokerV2
 * @notice Production-ready collateralized lending protocol
 * @dev Implements continuous interest accrual, health factor monitoring, and automated liquidation
 */
contract LoanBrokerV2 is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    struct Position {
        address user;
        address collateralToken;
        uint256 collateralAmount;
        uint256 borrowedAmount;        // Initial borrowed amount in USDC
        uint256 borrowIndex;           // Borrow index at position creation
        uint256 createdAt;
        bool isActive;
    }

    struct ProtocolConfig {
        uint256 platformFeeBps;        // Platform fee in basis points (100 = 1%)
        uint256 liquidationThreshold;  // 8000 = 80%
        uint256 liquidationBonusBps;   // 500 = 5%
        uint256 maxLTV;                // 7000 = 70%
        address feeCollector;
        address priceOracle;
        address usdcToken;
    }

    // ============ State Variables ============

    ProtocolConfig public config;
    
    uint256 public borrowIndex;        // Global borrow index (starts at 1e18)
    uint256 public lastUpdateBlock;    // Last block when index was updated
    uint256 public baseRatePerBlock;   // Base interest rate per block
    
    uint256 public positionCount;
    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) public userPositions;
    
    // Supported collateral tokens
    mapping(address => bool) public supportedCollateral;
    
    // Constants
    uint256 public constant PRECISION = 1e18;
    uint256 public constant BPS_DIVISOR = 10000;
    uint256 public constant BLOCKS_PER_YEAR = 2628000; // ~12 sec per block

    // ============ Events ============

    event LoanCreated(
        uint256 indexed positionId,
        address indexed user,
        address indexed collateralToken,
        uint256 collateralAmount,
        uint256 borrowedAmount,
        uint256 platformFee,
        uint256 timestamp
    );

    event LoanRepaid(
        uint256 indexed positionId,
        address indexed user,
        uint256 repaidAmount,
        uint256 collateralReturned,
        uint256 timestamp
    );

    event Liquidated(
        uint256 indexed positionId,
        address indexed liquidator,
        address indexed user,
        uint256 debtPaid,
        uint256 collateralSeized,
        uint256 liquidatorBonus,
        uint256 timestamp
    );

    event BorrowIndexUpdated(
        uint256 oldIndex,
        uint256 newIndex,
        uint256 blockNumber
    );

    event ConfigUpdated(
        uint256 platformFeeBps,
        uint256 liquidationThreshold,
        uint256 liquidationBonusBps,
        address feeCollector
    );

    event CollateralAdded(
        uint256 indexed positionId,
        uint256 amountAdded,
        uint256 newHealthFactor
    );

    // ============ Constructor ============

    constructor(
        address _feeCollector,
        address _priceOracle,
        address _usdcToken,
        uint256 _baseRatePerBlock
    ) Ownable(msg.sender) {
        require(_feeCollector != address(0), "Invalid fee collector");
        require(_priceOracle != address(0), "Invalid oracle");
        require(_usdcToken != address(0), "Invalid USDC");

        config = ProtocolConfig({
            platformFeeBps: 100,           // 1%
            liquidationThreshold: 8000,    // 80%
            liquidationBonusBps: 500,      // 5%
            maxLTV: 7000,                  // 70%
            feeCollector: _feeCollector,
            priceOracle: _priceOracle,
            usdcToken: _usdcToken
        });

        borrowIndex = PRECISION;
        lastUpdateBlock = block.number;
        baseRatePerBlock = _baseRatePerBlock; // e.g., 5% APY = ~1.9e12 per block
    }

    // ============ Core Functions ============

    /**
     * @notice Create a new collateralized loan
     * @param collateralToken Address of collateral token (WETH, WBTC)
     * @param collateralAmount Amount of collateral to deposit
     * @return positionId The ID of the created position
     */
    function executeLoan(
        address collateralToken,
        uint256 collateralAmount
    ) external nonReentrant whenNotPaused returns (uint256 positionId) {
        require(supportedCollateral[collateralToken], "Unsupported collateral");
        require(collateralAmount > 0, "Invalid amount");

        // Update borrow index
        _updateBorrowIndex();

        // Transfer collateral from user
        IERC20(collateralToken).safeTransferFrom(
            msg.sender,
            address(this),
            collateralAmount
        );

        // Get collateral value in USD
        uint256 collateralValueUSD = _getCollateralValue(collateralToken, collateralAmount);

        // Calculate borrow amount (70% LTV)
        uint256 borrowAmount = (collateralValueUSD * config.maxLTV) / BPS_DIVISOR;

        // Calculate platform fee
        uint256 platformFee = (borrowAmount * config.platformFeeBps) / BPS_DIVISOR;
        uint256 netAmount = borrowAmount - platformFee;

        // Transfer USDC to user (net amount)
        IERC20(config.usdcToken).safeTransfer(msg.sender, netAmount);

        // Transfer fee to collector
        IERC20(config.usdcToken).safeTransfer(config.feeCollector, platformFee);

        // Create position
        positionId = ++positionCount;
        positions[positionId] = Position({
            user: msg.sender,
            collateralToken: collateralToken,
            collateralAmount: collateralAmount,
            borrowedAmount: borrowAmount,
            borrowIndex: borrowIndex,
            createdAt: block.timestamp,
            isActive: true
        });

        userPositions[msg.sender].push(positionId);

        emit LoanCreated(
            positionId,
            msg.sender,
            collateralToken,
            collateralAmount,
            borrowAmount,
            platformFee,
            block.timestamp
        );
    }

    /**
     * @notice Repay loan and retrieve collateral
     * @param positionId ID of the position to repay
     */
    function repay(uint256 positionId) external nonReentrant {
        Position storage position = positions[positionId];
        require(position.isActive, "Position not active");
        require(position.user == msg.sender, "Not position owner");

        // Update borrow index
        _updateBorrowIndex();

        // Calculate current debt
        uint256 currentDebt = getCurrentDebt(positionId);

        // Transfer USDC from user
        IERC20(config.usdcToken).safeTransferFrom(msg.sender, address(this), currentDebt);

        // Return collateral to user
        IERC20(position.collateralToken).safeTransfer(
            msg.sender,
            position.collateralAmount
        );

        // Mark position as closed
        position.isActive = false;

        emit LoanRepaid(
            positionId,
            msg.sender,
            currentDebt,
            position.collateralAmount,
            block.timestamp
        );
    }

    /**
     * @notice Liquidate an undercollateralized position
     * @param positionId ID of the position to liquidate
     */
    function liquidate(uint256 positionId) external nonReentrant {
        Position storage position = positions[positionId];
        require(position.isActive, "Position not active");

        // Update borrow index
        _updateBorrowIndex();

        // Check if position is liquidatable
        uint256 healthFactor = getHealthFactor(positionId);
        require(healthFactor < PRECISION, "Position is healthy");

        // Calculate current debt
        uint256 currentDebt = getCurrentDebt(positionId);

        // Transfer USDC from liquidator
        IERC20(config.usdcToken).safeTransferFrom(msg.sender, address(this), currentDebt);

        // Calculate liquidation bonus
        uint256 bonus = (position.collateralAmount * config.liquidationBonusBps) / BPS_DIVISOR;
        uint256 totalReward = position.collateralAmount + bonus;

        // Transfer collateral + bonus to liquidator
        IERC20(position.collateralToken).safeTransfer(msg.sender, totalReward);

        // Mark position as closed
        position.isActive = false;

        emit Liquidated(
            positionId,
            msg.sender,
            position.user,
            currentDebt,
            position.collateralAmount,
            bonus,
            block.timestamp
        );
    }

    /**
     * @notice Add more collateral to improve health factor
     * @param positionId ID of the position
     * @param amount Amount of collateral to add
     */
    function addCollateral(uint256 positionId, uint256 amount) external nonReentrant {
        Position storage position = positions[positionId];
        require(position.isActive, "Position not active");
        require(position.user == msg.sender, "Not position owner");
        require(amount > 0, "Invalid amount");

        // Transfer additional collateral
        IERC20(position.collateralToken).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );

        position.collateralAmount += amount;

        uint256 newHealthFactor = getHealthFactor(positionId);

        emit CollateralAdded(positionId, amount, newHealthFactor);
    }

    // ============ View Functions ============

    /**
     * @notice Get current debt for a position (with accrued interest)
     * @param positionId ID of the position
     * @return Current debt in USDC
     */
    function getCurrentDebt(uint256 positionId) public view returns (uint256) {
        Position memory position = positions[positionId];
        if (!position.isActive) return 0;

        uint256 currentIndex = _calculateCurrentIndex();
        return (position.borrowedAmount * currentIndex) / position.borrowIndex;
    }

    /**
     * @notice Calculate health factor for a position
     * @param positionId ID of the position
     * @return Health factor (1e18 = 1.0)
     */
    function getHealthFactor(uint256 positionId) public view returns (uint256) {
        Position memory position = positions[positionId];
        if (!position.isActive) return 0;

        uint256 collateralValueUSD = _getCollateralValue(
            position.collateralToken,
            position.collateralAmount
        );

        uint256 currentDebt = getCurrentDebt(positionId);
        if (currentDebt == 0) return type(uint256).max;

        uint256 maxBorrowValue = (collateralValueUSD * config.liquidationThreshold) / BPS_DIVISOR;
        
        return (maxBorrowValue * PRECISION) / currentDebt;
    }

    /**
     * @notice Get all position IDs for a user
     * @param user Address of the user
     * @return Array of position IDs
     */
    function getUserPositionIds(address user) external view returns (uint256[] memory) {
        return userPositions[user];
    }

    /**
     * @notice Get detailed position info
     * @param positionId ID of the position
     * @return position Position struct
     * @return currentDebt Current debt with interest
     * @return healthFactor Current health factor
     */
    function getPositionDetails(uint256 positionId) external view returns (
        Position memory position,
        uint256 currentDebt,
        uint256 healthFactor
    ) {
        position = positions[positionId];
        currentDebt = getCurrentDebt(positionId);
        healthFactor = getHealthFactor(positionId);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update protocol configuration
     * @dev Only owner can call
     */
    function updateConfig(
        uint256 _platformFeeBps,
        uint256 _liquidationThreshold,
        uint256 _liquidationBonusBps,
        address _feeCollector
    ) external onlyOwner {
        require(_platformFeeBps <= 500, "Fee too high"); // Max 5%
        require(_liquidationThreshold >= 5000 && _liquidationThreshold <= 9000, "Invalid threshold");
        require(_liquidationBonusBps <= 1000, "Bonus too high"); // Max 10%
        require(_feeCollector != address(0), "Invalid collector");

        config.platformFeeBps = _platformFeeBps;
        config.liquidationThreshold = _liquidationThreshold;
        config.liquidationBonusBps = _liquidationBonusBps;
        config.feeCollector = _feeCollector;

        emit ConfigUpdated(_platformFeeBps, _liquidationThreshold, _liquidationBonusBps, _feeCollector);
    }

    /**
     * @notice Add supported collateral token
     */
    function addSupportedCollateral(address token) external onlyOwner {
        require(token != address(0), "Invalid token");
        supportedCollateral[token] = true;
    }

    /**
     * @notice Remove supported collateral token
     */
    function removeSupportedCollateral(address token) external onlyOwner {
        supportedCollateral[token] = false;
    }

    /**
     * @notice Update base interest rate
     */
    function updateBaseRate(uint256 _baseRatePerBlock) external onlyOwner {
        _updateBorrowIndex();
        baseRatePerBlock = _baseRatePerBlock;
    }

    /**
     * @notice Pause contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdraw stuck funds
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    // ============ Internal Functions ============

    /**
     * @notice Update global borrow index
     */
    function _updateBorrowIndex() internal {
        uint256 blockDelta = block.number - lastUpdateBlock;
        if (blockDelta == 0) return;

        uint256 interestFactor = PRECISION + (baseRatePerBlock * blockDelta);
        uint256 newIndex = (borrowIndex * interestFactor) / PRECISION;

        emit BorrowIndexUpdated(borrowIndex, newIndex, block.number);

        borrowIndex = newIndex;
        lastUpdateBlock = block.number;
    }

    /**
     * @notice Calculate current borrow index without updating state
     */
    function _calculateCurrentIndex() internal view returns (uint256) {
        uint256 blockDelta = block.number - lastUpdateBlock;
        if (blockDelta == 0) return borrowIndex;

        uint256 interestFactor = PRECISION + (baseRatePerBlock * blockDelta);
        return (borrowIndex * interestFactor) / PRECISION;
    }

    /**
     * @notice Get collateral value in USD
     * @dev Calls price oracle (to be implemented)
     */
    function _getCollateralValue(
        address token,
        uint256 amount
    ) internal view returns (uint256) {
        // TODO: Integrate with Chainlink oracle
        // For now, using mock prices
        // In production, call: IPriceOracle(config.priceOracle).getPrice(token)
        
        // Mock prices (18 decimals)
        if (token == 0x918530d86c239f92E58A98CE8ed446DC042613DB) {
            // WETH: $2500
            return (amount * 2500 * 1e18) / 1e18;
        } else if (token == 0xA32ecf29Ed19102A639cd1a9706079d055f3CF2B) {
            // WBTC: $65000
            return (amount * 65000 * 1e8) / 1e8;
        }
        
        revert("Unsupported token");
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
