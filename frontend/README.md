# DedlyFi - Collateral Loans PoC (Frontend)

## 📋 Overview
Frontend application for the DedlyFi Collateral Loans Proof of Concept. Users can deposit WETH or WBTC as collateral and borrow USDC against it through various DeFi protocols (Uniswap, Aave, Lido).

## 🚀 Features
- **Multi-Protocol Support**: Borrow from Uniswap, Aave, or Lido
- **Real-time Opportunities**: Fetches best borrow rates from backend API
- **Wallet Integration**: Connect via RainbowKit (MetaMask, WalletConnect, etc.)
- **Interactive UI**: 
  - Animated loan simulation with CountUp
  - Tooltips explaining each field
  - Loading animations during transactions
  - Success confetti and toast notifications
- **Mock Mode**: Simulate transactions without blockchain interaction (for demos)

## 🛠 Tech Stack
- **React** + **Vite**
- **Wagmi** + **Viem** (Ethereum interactions)
- **RainbowKit** (Wallet connection)
- **Sonner** (Toast notifications)
- **Framer Motion** (Animations)
- **React CountUp** (Number animations)
- **Radix UI** (Tooltips)

## 📦 Installation

```bash
npm install
```

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
# Backend API
VITE_API_URL=http://localhost:3001/api

# Smart Contracts (Sepolia Testnet)
VITE_BROKER_ADDRESS=0x641b9F16B7504692680B0E4E513b1902278F7C90
VITE_TOKEN_WETH=0x918530d86c239f92E58A98CE8ed446DC042613DB
VITE_TOKEN_WBTC=0xA32ecf29Ed19102A639cd1a9706079d055f3CF2B

# Adapters
VITE_ADAPTER_UNISWAP=0x5e01a1cBdfddA63D20d74E121B778d87A5AC0178
VITE_ADAPTER_AAVE=0xFbe1cE67358c2333663738020F861438B7FAe929
VITE_ADAPTER_LIDO=0x1D42Ad1bdb32bEb309F184C3AA0D5BA7B8Bd3f6F

# Mock Mode (for PoC demos without liquidity)
VITE_MOCK_MODE=true
```

## 🏃‍♂️ Running the App

### Development Mode
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or next available port).

### Production Build
```bash
npm run build
npm run preview
```

## 🎯 Mock Mode

**What is Mock Mode?**
Mock Mode allows you to simulate the entire loan flow without actual blockchain transactions. This is useful for:
- **Demos**: Show the UX without needing testnet funds or liquidity
- **Development**: Test UI flows without waiting for blockchain confirmations
- **PoC Presentations**: Demonstrate the concept when testnet pools are empty

**How to Enable:**
Set `VITE_MOCK_MODE=true` in your `.env` file.

**What happens in Mock Mode:**
1. Simulates approval and execution steps with realistic delays
2. Generates fake transaction hashes
3. Triggers success animations (confetti, toasts)
4. **No blockchain interaction** - purely frontend simulation

**Switching to Production:**
Simply set `VITE_MOCK_MODE=false` and ensure:
- Backend is running and connected to Sepolia
- Smart contracts have sufficient USDC liquidity
- User has testnet ETH for gas

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx              # Navigation + Wallet Connect
│   │   ├── LoanModal.jsx           # Main loan interface
│   │   ├── LoadingAnimation.jsx    # Transaction loading state
│   │   └── ui/
│   │       └── Tooltip.jsx         # Reusable tooltip component
│   ├── hooks/
│   │   └── useLoanExecution.js     # Loan transaction logic + Mock Mode
│   ├── abis/
│   │   └── LoanBroker.json         # Smart contract ABI
│   ├── utils/
│   │   ├── constants.js            # Token addresses, API URL
│   │   ├── logger.js               # Colored console logging
│   │   └── wagmi.js                # Wagmi configuration
│   ├── App.jsx                     # Main app + routing
│   ├── main.jsx                    # Entry point
│   └── index.css                   # Global styles
├── public/
│   └── icons/                      # Protocol and token logos
├── .env                            # Environment variables
└── package.json
```

## 🔑 Key Components

### `LoanModal.jsx`
The core UI for borrowing:
- Input collateral amount
- Real-time loan simulation (LTV, fees, net receive)
- Terms acceptance checkbox
- Transaction status (Approving → Executing → Success)
- Tooltips explaining each field
- CountUp animations for currency values

### `useLoanExecution.js`
Handles the loan execution flow:
1. **Check Allowance**: Verify if token approval is needed
2. **Approve Token**: Request user approval if needed
3. **Simulate Transaction**: Validate before opening wallet
4. **Execute Loan**: Call `LoanBroker.executeLoan()`
5. **Wait for Confirmation**: Monitor transaction receipt

**Mock Mode Logic**: If `VITE_MOCK_MODE=true`, skips blockchain calls and simulates delays.

## 🎨 Design System

### Colors (CSS Variables)
```css
--bg-dark: #0b0e14
--bg-card: #151a23
--primary-blue: #3b82f6
--success: #22c55e
--error: #ef4444
--highlight: #a855f7
```

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 400, 500, 600, 700

## 🧪 Testing the Flow

### With Mock Mode (Recommended for PoC)
1. Set `VITE_MOCK_MODE=true`
2. Connect wallet
3. Select a borrow option
4. Enter collateral amount
5. Accept terms
6. Click "Confirm Borrow"
7. Watch the loading animation → Success confetti

### With Real Blockchain
1. Set `VITE_MOCK_MODE=false`
2. Ensure backend is running
3. Ensure `LoanBroker` contract has USDC liquidity
4. Get Sepolia testnet ETH and WETH/WBTC
5. Follow the same flow as Mock Mode
6. Approve transactions in MetaMask

## 🚧 Known Limitations (PoC)

- **Testnet Liquidity**: Sepolia pools may not have sufficient USDC
- **Price Feeds**: Uses mock prices in frontend (not oracle data)
- **Repayment**: UI not yet implemented (coming soon)
- **Position Tracking**: Dashboard shows placeholder (backend integration pending)

## 🔮 Roadmap to Production

1. **Remove Mock Mode**: Ensure all contracts are funded
2. **Integrate Chainlink Oracles**: Replace mock prices
3. **Add Repayment Flow**: Allow users to close loans
4. **Position Dashboard**: Fetch and display active loans
5. **Multi-chain Support**: Expand beyond Sepolia
6. **Security Audit**: Review all smart contract interactions

## 📞 Support

For issues or questions, contact the development team or check the main project README.

---

**Built with ❤️ by the DedlyFi Team**
