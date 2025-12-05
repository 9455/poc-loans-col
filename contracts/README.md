# DedlyFi - Collateral Loans PoC (Smart Contracts)

## 📋 Overview
Solidity smart contracts for the DedlyFi Collateral Loans system. Allows users to deposit WETH/WBTC as collateral and borrow USDC through various DeFi protocol adapters.

## 🚀 Features
- **LoanBroker**: Main contract coordinating loans across protocols
- **Adapter Pattern**: Modular design for Uniswap, Aave, Lido integrations
- **Fee Management**: 1% platform fee on all loans
- **ERC20 Support**: Works with any ERC20 collateral token
- **Ownable**: Admin functions for emergency withdrawals and fee collection

## 🛠 Tech Stack
- **Solidity** ^0.8.20
- **Hardhat** (Development framework)
- **OpenZeppelin Contracts** (Security standards)
- **Ethers.js** (Deployment scripts)

## 📦 Installation

```bash
npm install
```

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
# Sepolia Testnet
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_here

# Etherscan (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 🏗 Contracts

### `LoanBroker.sol`
Main contract that:
1. Receives collateral from users
2. Routes to appropriate adapter (Uniswap, Aave, Lido)
3. Charges 1% platform fee
4. Transfers borrowed USDC to user

**Key Functions:**
- `executeLoan(address adapter, address token, uint256 amount)`: Execute a collateralized loan
- `setFeeCollector(address _feeCollector)`: Update fee recipient (owner only)
- `emergencyWithdraw(address token)`: Recover stuck funds (owner only)

### Adapters
Each adapter implements the same interface:
```solidity
interface IAdapter {
    function deposit(address token, uint256 amount) external returns (uint256 borrowed);
}
```

**Implemented Adapters:**
- `UniswapAdapter.sol`: Swaps collateral for USDC via Uniswap V3
- `AaveAdapter.sol`: Deposits collateral to Aave, borrows USDC
- `LidoAdapter.sol`: Stakes ETH with Lido, borrows against stETH

## 🏃‍♂️ Compilation

```bash
npx hardhat compile
```

## 🚀 Deployment

### Deploy to Sepolia Testnet
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Deploy Locally (Hardhat Network)
```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

## 🧪 Testing

```bash
npx hardhat test
```

### Run with Coverage
```bash
npx hardhat coverage
```

## 📁 Project Structure

```
contracts/
├── contracts/
│   ├── LoanBroker.sol          # Main loan coordinator
│   ├── adapters/
│   │   ├── UniswapAdapter.sol  # Uniswap V3 integration
│   │   ├── AaveAdapter.sol     # Aave V3 integration
│   │   └── LidoAdapter.sol     # Lido staking integration
│   └── interfaces/
│       └── IAdapter.sol        # Adapter interface
├── scripts/
│   └── deploy.js               # Deployment script
├── test/
│   └── LoanBroker.test.js      # Unit tests
├── hardhat.config.js           # Hardhat configuration
└── README.md                   # This file
```

## 🔑 Key Design Patterns

### Adapter Pattern
Each DeFi protocol has its own adapter contract. This allows:
- **Modularity**: Add new protocols without changing `LoanBroker`
- **Upgradability**: Replace adapters if protocol APIs change
- **Isolation**: Bugs in one adapter don't affect others

### Fee Mechanism
- 1% fee (100 basis points) charged on all loans
- Fee sent to `feeCollector` address (configurable by owner)
- Calculated as: `fee = loanAmount * 100 / 10000`

### Security Features
- **SafeERC20**: Prevents issues with non-standard ERC20 tokens
- **Ownable**: Admin functions protected
- **Reentrancy Protection**: Uses OpenZeppelin's `ReentrancyGuard` (if needed)

## 🚧 Known Limitations (PoC)

- **No Liquidation**: Users can't be liquidated if collateral value drops
- **No Interest Accrual**: Loans don't accumulate interest over time
- **No Repayment Logic**: Users can't close loans (coming soon)
- **Mock Oracles**: Price feeds not integrated (uses hardcoded values in adapters)

## 🔮 Roadmap to Production

1. **Add Chainlink Oracles**: Real-time price feeds for LTV calculations
2. **Implement Liquidation**: Allow liquidators to close undercollateralized loans
3. **Add Interest Rates**: Time-based interest accrual
4. **Repayment Flow**: Allow users to repay and withdraw collateral
5. **Multi-chain Deployment**: Expand to Arbitrum, Optimism, Polygon
6. **Security Audit**: Professional audit before mainnet launch

## 📊 Deployed Contracts (Sepolia)

```
LoanBroker:       0x641b9F16B7504692680B0E4E513b1902278F7C90
UniswapAdapter:   0x5e01a1cBdfddA63D20d74E121B778d87A5AC0178
AaveAdapter:      0xFbe1cE67358c2333663738020F861438B7FAe929
LidoAdapter:      0x1D42Ad1bdb32bEb309F184C3AA0D5BA7B8Bd3f6F
```

## 🧪 Testing on Sepolia

### Get Testnet Tokens
1. **Sepolia ETH**: [Sepolia Faucet](https://sepoliafaucet.com/)
2. **WETH**: Wrap ETH at [Sepolia WETH Contract](https://sepolia.etherscan.io/address/0x...)
3. **WBTC**: Request from [Sepolia WBTC Faucet](https://...)

### Interact with Contracts
```bash
# Using Hardhat console
npx hardhat console --network sepolia

# Example: Execute a loan
const broker = await ethers.getContractAt("LoanBroker", "0x641b9F16B7504692680B0E4E513b1902278F7C90");
const tx = await broker.executeLoan(
  "0x5e01a1cBdfddA63D20d74E121B778d87A5AC0178", // Uniswap adapter
  "0x918530d86c239f92E58A98CE8ed446DC042613DB", // WETH
  ethers.parseEther("1")
);
await tx.wait();
```

## 📞 Support

For issues or questions, contact the development team or check the main project README.

---

**Built with ❤️ by the DedlyFi Team**
