# DedlyFi Fee Structure & Transparency

## 🎯 Overview

DedlyFi implements a transparent, configurable fee system that balances platform sustainability with user value. All fees are on-chain, immutable in logic but configurable in parameters, ensuring complete transparency.

## 💰 Fee Structure

### **1. Platform Fee (Configurable)**

**Current Rate:** 1% (100 basis points)  
**Applied To:** Borrowed amount at loan creation  
**Configurable Range:** 0% - 5% (0-500 bps)  
**Who Can Change:** Contract owner (via governance in future)

**Example:**
```
User deposits: 10 WETH ($25,000)
Max borrow (70% LTV): $17,500 USDC
Platform fee (1%): $175 USDC
User receives: $17,325 USDC
```

**Smart Contract Implementation:**
```solidity
// In LoanBrokerV2.sol
uint256 platformFee = (borrowAmount * config.platformFeeBps) / BPS_DIVISOR;
uint256 netAmount = borrowAmount - platformFee;

// Transfer net amount to user
IERC20(config.usdcToken).safeTransfer(msg.sender, netAmount);

// Transfer fee to collector
IERC20(config.usdcToken).safeTransfer(config.feeCollector, platformFee);

emit LoanCreated(positionId, msg.sender, collateralToken, collateralAmount, borrowAmount, platformFee, block.timestamp);
```

**Transparency:**
- ✅ Fee amount emitted in `LoanCreated` event
- ✅ Visible on blockchain explorer
- ✅ Displayed in frontend before confirmation
- ✅ Stored in MongoDB for analytics

---

### **2. Interest Rate (Continuous Accrual)**

**Current Rate:** 5% APY  
**Type:** Continuous compound interest (per block)  
**Formula:** `debt = initialDebt * (currentIndex / initialIndex)`

**How It Works:**
```
Block 0: User borrows $10,000
Block 2,628,000 (1 year): Debt = $10,500
Block 5,256,000 (2 years): Debt = $11,025
```

**Smart Contract Implementation:**
```solidity
// Update global borrow index every block
function _updateBorrowIndex() internal {
    uint256 blockDelta = block.number - lastUpdateBlock;
    uint256 interestFactor = PRECISION + (baseRatePerBlock * blockDelta);
    borrowIndex = (borrowIndex * interestFactor) / PRECISION;
    lastUpdateBlock = block.number;
}

// Calculate current debt for a position
function getCurrentDebt(uint256 positionId) public view returns (uint256) {
    Position memory pos = positions[positionId];
    uint256 currentIndex = _calculateCurrentIndex();
    return (pos.borrowedAmount * currentIndex) / pos.borrowIndex;
}
```

**Transparency:**
- ✅ Interest rate visible on-chain
- ✅ Current debt calculable at any time
- ✅ No hidden fees or surprises
- ✅ Frontend shows real-time debt

---

### **3. Liquidation Bonus (Incentive for Liquidators)**

**Current Rate:** 5% (500 basis points)  
**Applied To:** Collateral value  
**Purpose:** Incentivize liquidators to maintain protocol health  
**Configurable Range:** 0% - 10% (0-1000 bps)

**Example:**
```
Position Details:
- Collateral: 10 ETH @ $1,300 = $13,000
- Debt: $10,500
- Health Factor: 0.99 (liquidatable)

Liquidation:
- Liquidator pays: $10,500 USDC
- Liquidator receives: 10 ETH + 0.5 ETH bonus = 10.5 ETH ($13,650)
- Liquidator profit: $3,150
```

**Smart Contract Implementation:**
```solidity
function liquidate(uint256 positionId) external nonReentrant {
    Position storage position = positions[positionId];
    require(position.isActive, "Position not active");
    
    uint256 healthFactor = getHealthFactor(positionId);
    require(healthFactor < PRECISION, "Position is healthy");
    
    uint256 currentDebt = getCurrentDebt(positionId);
    
    // Liquidator pays debt
    IERC20(config.usdcToken).safeTransferFrom(msg.sender, address(this), currentDebt);
    
    // Calculate bonus
    uint256 bonus = (position.collateralAmount * config.liquidationBonusBps) / BPS_DIVISOR;
    uint256 totalReward = position.collateralAmount + bonus;
    
    // Transfer collateral + bonus to liquidator
    IERC20(position.collateralToken).safeTransfer(msg.sender, totalReward);
    
    position.isActive = false;
    
    emit Liquidated(positionId, msg.sender, position.user, currentDebt, position.collateralAmount, bonus, block.timestamp);
}
```

**Transparency:**
- ✅ Bonus rate visible on-chain
- ✅ Liquidation events publicly logged
- ✅ Users can monitor their health factor
- ✅ Warnings sent when health < 1.2

---

## 🔧 Fee Configuration System

### **On-Chain Configuration**

```solidity
struct ProtocolConfig {
    uint256 platformFeeBps;        // Platform fee (100 = 1%)
    uint256 liquidationThreshold;  // 8000 = 80%
    uint256 liquidationBonusBps;   // 500 = 5%
    uint256 maxLTV;                // 7000 = 70%
    address feeCollector;
    address priceOracle;
    address usdcToken;
}
```

### **Update Function (Owner Only)**

```solidity
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
```

**Safety Mechanisms:**
- ✅ **Maximum Limits:** Platform fee capped at 5%
- ✅ **Validation:** All parameters validated before update
- ✅ **Events:** All changes emit events for transparency
- ✅ **Timelock (Future):** Add 24-48h delay for governance

---

## 📊 Fee Distribution

### **Platform Fee Allocation**

```
100% of platform fees → Fee Collector Address

Future Distribution (with Governance):
- 50% → Treasury (protocol development)
- 30% → Liquidity Providers
- 20% → Token Buyback & Burn
```

### **Interest Allocation**

```
100% of interest → Protocol Reserve

Purpose:
- Cover bad debt
- Provide liquidity
- Fund insurance pool
```

---

## 🔍 Transparency Mechanisms

### **1. On-Chain Events**

Every fee-related action emits an event:

```solidity
event LoanCreated(
    uint256 indexed positionId,
    address indexed user,
    address indexed collateralToken,
    uint256 collateralAmount,
    uint256 borrowedAmount,
    uint256 platformFee,  // ← Fee amount visible
    uint256 timestamp
);

event ConfigUpdated(
    uint256 platformFeeBps,
    uint256 liquidationThreshold,
    uint256 liquidationBonusBps,
    address feeCollector
);
```

### **2. Frontend Display**

**Before Transaction:**
```javascript
// LoanModal.jsx
<div className="fee-breakdown">
    <div className="fee-row">
        <span>Borrow Amount</span>
        <span>${borrowAmount.toFixed(2)}</span>
    </div>
    <div className="fee-row">
        <Tooltip content="1% platform fee for loan facilitation">
            <span>Platform Fee (1%)</span>
        </Tooltip>
        <span className="text-error">-${platformFee.toFixed(2)}</span>
    </div>
    <div className="fee-row total">
        <span>You Receive</span>
        <span className="text-highlight">${netReceive.toFixed(2)}</span>
    </div>
</div>
```

**After Transaction:**
```javascript
// Position Dashboard
<div className="position-details">
    <div className="detail-row">
        <span>Initial Borrowed</span>
        <span>${position.borrowedAmount.toFixed(2)}</span>
    </div>
    <div className="detail-row">
        <span>Platform Fee Paid</span>
        <span>${position.platformFee.toFixed(2)}</span>
    </div>
    <div className="detail-row">
        <span>Current Debt (with interest)</span>
        <span className="text-warning">${currentDebt.toFixed(2)}</span>
    </div>
    <div className="detail-row">
        <span>Accrued Interest</span>
        <span>${(currentDebt - position.borrowedAmount).toFixed(2)}</span>
    </div>
</div>
```

### **3. Analytics Dashboard**

**Platform-Wide Metrics:**
```javascript
// GET /api/loans/stats
{
    "totalFees Collected": "$125,430",
    "totalInterestAccrued": "$45,230",
    "averagePlatformFee": "1.0%",
    "totalLiquidations": 12,
    "totalLiquidationBonuses": "$15,400"
}
```

**User-Specific:**
```javascript
// GET /api/users/:address/stats
{
    "totalBorrowed": "$50,000",
    "totalFeesPaid": "$500",
    "totalInterestPaid": "$1,250",
    "activePositions": 2,
    "averageHealthFactor": 1.85
}
```

---

## 🎯 Comparison with Competitors

| Feature | DedlyFi | Aave | Compound | MakerDAO |
|---------|---------|------|----------|----------|
| **Platform Fee** | 1% upfront | 0% | 0% | 0% |
| **Interest Rate** | 5% APY | 3-8% APY | 4-10% APY | 1-5% APY |
| **Liquidation Bonus** | 5% | 5-10% | 8% | 13% |
| **Fee Transparency** | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Configurable** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Governance** | 🔜 Soon | ✅ Yes | ✅ Yes | ✅ Yes |

**Why 1% Platform Fee?**
- Covers operational costs (oracles, infrastructure)
- Funds protocol development
- Lower than traditional finance (3-5%)
- Transparent and predictable

---

## 🔮 Future Enhancements

### **1. Governance**
```solidity
// Timelock for fee changes
function proposeConfigUpdate(...) external {
    // Create proposal
    // 48h voting period
    // 24h timelock after approval
}
```

### **2. Dynamic Interest Rates**
```solidity
// Utilization-based rates (like Aave)
function getBorrowRate() public view returns (uint256) {
    uint256 utilization = totalBorrowed / totalSupplied;
    if (utilization < 80%) {
        return baseRate + (utilization * slope1);
    } else {
        return baseRate + (80% * slope1) + ((utilization - 80%) * slope2);
    }
}
```

### **3. Fee Rebates**
```solidity
// Loyalty program
mapping(address => uint256) public userTier;

function calculateFee(address user, uint256 amount) internal view returns (uint256) {
    uint256 baseFee = (amount * config.platformFeeBps) / BPS_DIVISOR;
    uint256 discount = (baseFee * tierDiscounts[userTier[user]]) / BPS_DIVISOR;
    return baseFee - discount;
}
```

---

## 📞 Fee Transparency Commitment

**DedlyFi Pledge:**
1. ✅ All fees visible before transaction
2. ✅ No hidden charges
3. ✅ On-chain configuration
4. ✅ Public events for all changes
5. ✅ Community governance (coming soon)
6. ✅ Regular audits
7. ✅ Open-source contracts

**Questions?**
- View fees: `loanBroker.config()`
- Track changes: Monitor `ConfigUpdated` events
- Verify: Check Etherscan
- Contact: support@dedlyfi.com

---

**Built with Transparency 🔍 | Powered by Blockchain ⛓️**
