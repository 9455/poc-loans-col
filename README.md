# DedlyFi - Collateral Loans PoC

## 📋 Overview
Proof of Concept for a decentralized collateral-based lending platform. Users can deposit WETH or WBTC as collateral and borrow USDC through multiple DeFi protocols (Uniswap, Aave, Lido).

## 🎯 Project Goals
- **Demonstrate Multi-Protocol Aggregation**: Route loans to best available rates
- **Showcase Modern Web3 UX**: Smooth wallet integration, real-time simulations, animated feedback
- **Prove Scalability**: Modular adapter pattern for easy protocol additions
- **Enable PoC Demos**: Mock mode for presentations without blockchain dependencies

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  (React + Wagmi + RainbowKit + Vite)                       │
│  - Wallet connection                                        │
│  - Loan simulation UI                                       │
│  - Transaction management                                   │
│  - Mock mode for demos                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ REST API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                             │
│  (Node.js + Express)                                        │
│  - Aggregates opportunities from protocols                  │
│  - Tracks user positions                                    │
│  - Provides best rates                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Web3 RPC
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Smart Contracts                          │
│  (Solidity + Hardhat)                                       │
│  - LoanBroker: Main coordinator                             │
│  - Adapters: Uniswap, Aave, Lido                           │
│  - Fee management (1%)                                      │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Repository Structure

```
poc-loans-col/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── abis/
│   └── README.md
├── backend/           # Express API server
│   ├── index.js
│   └── README.md
├── contracts/         # Solidity smart contracts
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   └── README.md
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ 
- **npm** or **yarn**
- **MetaMask** or compatible Web3 wallet
- **Sepolia testnet ETH** (for real transactions)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd poc-loans-col
```

### 2. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# Contracts (if deploying)
cd ../contracts
npm install
```

### 3. Configure Environment Variables

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3001/api
VITE_BROKER_ADDRESS=0x641b9F16B7504692680B0E4E513b1902278F7C90
VITE_TOKEN_WETH=0x918530d86c239f92E58A98CE8ed446DC042613DB
VITE_TOKEN_WBTC=0xA32ecf29Ed19102A639cd1a9706079d055f3CF2B
VITE_ADAPTER_UNISWAP=0x5e01a1cBdfddA63D20d74E121B778d87A5AC0178
VITE_ADAPTER_AAVE=0xFbe1cE67358c2333663738020F861438B7FAe929
VITE_ADAPTER_LIDO=0x1D42Ad1bdb32bEb309F184C3AA0D5BA7B8Bd3f6F
VITE_MOCK_MODE=true  # Set to false for real blockchain interactions
```

**Backend** (`backend/.env`):
```env
PORT=3001
```

**Contracts** (`contracts/.env`):
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access the app:** `http://localhost:5173`

## 🎮 Using the Application

### Mock Mode (Recommended for Demos)
1. Ensure `VITE_MOCK_MODE=true` in `frontend/.env`
2. Connect your wallet (any network works)
3. Select a borrow option (Uniswap, Aave, or Lido)
4. Enter collateral amount
5. Accept terms
6. Click "Confirm Borrow"
7. Watch the simulated transaction flow (no real blockchain interaction)
8. See success confetti and toast notification

### Real Blockchain Mode
1. Set `VITE_MOCK_MODE=false`
2. Ensure you have:
   - Sepolia testnet ETH for gas
   - WETH or WBTC on Sepolia
   - Backend running and connected
3. Follow the same steps as Mock Mode
4. Approve transactions in MetaMask when prompted

## 🔑 Key Features

### Frontend
- ✅ **Multi-wallet support** (MetaMask, WalletConnect, Coinbase Wallet)
- ✅ **Real-time loan simulation** with animated CountUp numbers
- ✅ **Interactive tooltips** explaining every field
- ✅ **Loading animations** during transactions (Framer Motion)
- ✅ **Success feedback** (confetti + toast notifications)
- ✅ **Mock mode** for demos without blockchain
- ✅ **Responsive design** with dark theme

### Backend
- ✅ **Multi-protocol aggregation** (Uniswap, Aave, Lido)
- ✅ **RESTful API** for opportunities and user data
- ✅ **CORS enabled** for frontend communication
- ⏳ **Database integration** (coming soon)

### Smart Contracts
- ✅ **Modular adapter pattern** for easy protocol additions
- ✅ **1% platform fee** on all loans
- ✅ **ERC20 collateral support** (WETH, WBTC)
- ✅ **Emergency withdrawal** for admin
- ⏳ **Liquidation mechanism** (coming soon)
- ⏳ **Repayment flow** (coming soon)

## 🚧 Current Limitations (PoC)

This is a **Proof of Concept** with the following limitations:

1. **No Liquidation**: Loans can't be liquidated if collateral value drops
2. **No Repayment**: Users can't close loans yet (UI/contract pending)
3. **Mock Data**: Backend uses hardcoded opportunities (not live on-chain data)
4. **No Interest**: Loans don't accrue interest over time
5. **Testnet Only**: Deployed on Sepolia, not production-ready
6. **No Database**: User data stored in-memory (resets on restart)
7. **Limited Error Handling**: Some edge cases not covered

## 🔮 Roadmap to Production

### Phase 1: Core Functionality ✅ (Current)
- [x] Basic loan execution flow
- [x] Multi-protocol support
- [x] Wallet integration
- [x] Mock mode for demos

### Phase 2: Essential Features 🚧 (In Progress)
- [ ] Repayment UI and smart contract logic
- [ ] Position dashboard (track active loans)
- [ ] Interest accrual mechanism
- [ ] Database integration (PostgreSQL)

### Phase 3: Risk Management 📋 (Planned)
- [ ] Chainlink oracle integration for real-time prices
- [ ] Liquidation mechanism
- [ ] Health factor monitoring
- [ ] Automated liquidation bots

### Phase 4: Production Readiness 🎯 (Future)
- [ ] Security audit (smart contracts)
- [ ] Multi-chain deployment (Arbitrum, Optimism, Polygon)
- [ ] Rate limiting and DDoS protection
- [ ] Advanced analytics dashboard
- [ ] Governance token integration

## 🧪 Testing

### Frontend
```bash
cd frontend
npm run dev  # Manual testing in browser
```

### Backend
```bash
cd backend
npm run dev

# Test endpoints
curl http://localhost:3001/api/opportunities?token=WETH
```

### Smart Contracts
```bash
cd contracts
npx hardhat test
npx hardhat coverage
```

## 📊 Deployed Contracts (Sepolia Testnet)

| Contract | Address |
|----------|---------|
| LoanBroker | `0x641b9F16B7504692680B0E4E513b1902278F7C90` |
| UniswapAdapter | `0x5e01a1cBdfddA63D20d74E121B778d87A5AC0178` |
| AaveAdapter | `0xFbe1cE67358c2333663738020F861438B7FAe929` |
| LidoAdapter | `0x1D42Ad1bdb32bEb309F184C3AA0D5BA7B8Bd3f6F` |
| WETH (Mock) | `0x918530d86c239f92E58A98CE8ed446DC042613DB` |
| WBTC (Mock) | `0xA32ecf29Ed19102A639cd1a9706079d055f3CF2B` |

## 🛠 Tech Stack

### Frontend
- React 18
- Vite
- Wagmi v2 (Ethereum interactions)
- RainbowKit (Wallet connection)
- Framer Motion (Animations)
- React CountUp (Number animations)
- Radix UI (Tooltips)
- Sonner (Toast notifications)

### Backend
- Node.js
- Express
- CORS

### Smart Contracts
- Solidity ^0.8.20
- Hardhat
- OpenZeppelin Contracts
- Ethers.js

## 📚 Documentation

Each component has its own detailed README:
- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)
- [Contracts README](./contracts/README.md)

## 🤝 Contributing

This is a PoC project. For production contributions:
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## 📞 Support

For questions or issues:
- Open a GitHub issue
- Contact the development team
- Check individual component READMEs

## 📄 License

[MIT License](LICENSE) - feel free to use this PoC for learning and development.

---

**Built with ❤️ by the DedlyFi Team**

*Note: This is a Proof of Concept for educational and demonstration purposes. Not audited for production use.*
