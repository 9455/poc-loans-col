# DedlyFi Loans - Production Setup Guide

## 🎯 Overview
This guide explains how to set up the DedlyFi Collateral Loans platform for production use on Sepolia testnet, with MongoDB persistence and real blockchain interactions.

## 📋 Prerequisites

- **Node.js** v18+
- **MongoDB Atlas** account (or local MongoDB instance)
- **Sepolia Testnet ETH** for gas fees
- **MetaMask** or compatible Web3 wallet
- **Alchemy/Infura** API key (optional, for better RPC reliability)

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. **Create a MongoDB Atlas Account**
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster

2. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/database`)

3. **Configure Backend**
   - Update `backend/.env`:
   ```env
   MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/dedlyfi-loans?retryWrites=true&w=majority
   ```

4. **Whitelist IP Address**
   - In Atlas, go to "Network Access"
   - Add your server's IP (or `0.0.0.0/0` for testing)

### Local MongoDB (Alternative)

```bash
# Install MongoDB locally
brew install mongodb-community  # macOS
# or
sudo apt-get install mongodb    # Linux

# Start MongoDB
mongod --dbpath /path/to/data

# Update backend/.env
MONGO_URI=mongodb://localhost:27017/dedlyfi-loans
```

## 🔧 Backend Configuration

### 1. Environment Variables

Create `backend/.env`:

```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dedlyfi-loans?retryWrites=true&w=majority

# Server
PORT=3001
ACTIVE_NETWORK=sepolia

# Blockchain (Optional - for backend transactions)
PRIVATE_KEY=your_private_key_here
RPC_URL_SEPOLIA=https://ethereum-sepolia-rpc.publicnode.com

# Redis (for caching)
REDIS_URL=redis://default:password@host:port
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Token Addresses (Sepolia)
SEPOLIA_USDC_TOKEN=0xaDD1Fbe72192A8328AeD0EA6E1f729fde11Fd8Ad
SEPOLIA_WETH_TOKEN=0x918530d86c239f92E58A98CE8ed446DC042613DB
SEPOLIA_WBTC_TOKEN=0xA32ecf29Ed19102A639cd1a9706079d055f3CF2B

# Adapter Addresses (Sepolia)
ADAPTER_UNISWAP=0x5e01a1cBdfddA63D20d74E121B778d87A5AC0178
ADAPTER_AAVE=0xFbe1cE67358c2333663738020F861438B7FAe929
ADAPTER_LIDO=0x1D42Ad1bdb32bEb309F184C3AA0D5BA7B8Bd3f6F
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Start Backend

```bash
npm run dev
```

**Expected Output:**
```
[INFO] Server running on port 3001
[INFO] MongoDB Connected
[INFO] Redis Client Connected
[INFO] Swagger docs available at http://localhost:3001/api-docs
```

## 🎨 Frontend Configuration

### 1. Environment Variables

Create `frontend/.env`:

```env
# Backend API
VITE_API_URL=http://localhost:3001/api

# Smart Contracts (Sepolia)
VITE_BROKER_ADDRESS=0x641b9F16B7504692680B0E4E513b1902278F7C90
VITE_TOKEN_WETH=0x918530d86c239f92E58A98CE8ed446DC042613DB
VITE_TOKEN_WBTC=0xA32ecf29Ed19102A639cd1a9706079d055f3CF2B

# Adapters
VITE_ADAPTER_UNISWAP=0x5e01a1cBdfddA63D20d74E121B778d87A5AC0178
VITE_ADAPTER_AAVE=0xFbe1cE67358c2333663738020F861438B7FAe929
VITE_ADAPTER_LIDO=0x1D42Ad1bdb32bEb309F184C3AA0D5BA7B8Bd3f6F

# Mock Mode (set to false for production)
VITE_MOCK_MODE=false
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Start Frontend

```bash
npm run dev
```

**Access:** `http://localhost:5173`

## 🔄 Production Flow

### 1. Mock Mode (Demo/Testing)

**When:** `VITE_MOCK_MODE=true`

**Behavior:**
- Simulates blockchain transactions
- No real gas fees
- Generates fake transaction hashes
- Saves positions to MongoDB
- Perfect for demos and UI testing

**Use Case:** Presentations, UI development, testing without testnet funds

### 2. Production Mode (Real Blockchain)

**When:** `VITE_MOCK_MODE=false`

**Behavior:**
- Real blockchain interactions on Sepolia
- Requires MetaMask approval
- Actual gas fees (Sepolia ETH)
- Real transaction hashes
- Saves positions to MongoDB with block numbers

**Use Case:** Testing with real contracts, preparing for mainnet

## 📊 Database Schema

### Positions Collection

```javascript
{
  _id: ObjectId,
  userAddress: "0x...",           // Lowercase, indexed
  protocol: "Uniswap",             // Enum: Uniswap, Aave, Lido
  adapterAddress: "0x...",
  tokenSymbol: "WETH",             // Enum: WETH, WBTC, ETH
  tokenAddress: "0x...",
  collateralAmount: 10.0,          // Amount of tokens deposited
  collateralValueUSD: 25000.00,    // USD value at time of loan
  borrowAmount: 17500.00,          // Total borrowed (70% LTV)
  platformFee: 175.00,             // 1% fee
  netReceived: 17325.00,           // Amount user actually received
  apy: "5.38%",
  ltv: 0.70,                       // Loan-to-Value ratio
  txHash: "0x...",                 // Unique, indexed
  blockNumber: 1234567,
  network: "sepolia",
  status: "active",                // Enum: active, repaid, liquidated, pending
  healthFactor: 1.43,              // Liquidation indicator
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Users Collection

```javascript
{
  _id: ObjectId,
  address: "0x...",                // Unique, lowercase, indexed
  totalPositions: 5,
  activePositions: 2,
  totalBorrowed: 50000.00,
  totalRepaid: 30000.00,
  firstConnectedAt: ISODate,
  lastConnectedAt: ISODate,
  connectionCount: 15,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

## 🔍 API Endpoints

### Get Opportunities
```http
GET /api/loans/opportunities?token=WETH
```

### Create Position
```http
POST /api/loans/positions
Content-Type: application/json

{
  "userAddress": "0x...",
  "protocol": "Uniswap",
  "adapterAddress": "0x...",
  "tokenSymbol": "WETH",
  "tokenAddress": "0x...",
  "collateralAmount": 10,
  "collateralValueUSD": 25000,
  "borrowAmount": 17500,
  "platformFee": 175,
  "netReceived": 17325,
  "apy": "5.38%",
  "ltv": 0.70,
  "txHash": "0x...",
  "blockNumber": 1234567,
  "network": "sepolia"
}
```

### Get User Positions
```http
GET /api/loans/positions/0x...?status=active&protocol=Uniswap
```

### Get Position by ID
```http
GET /api/loans/position/:id
```

### Get Platform Stats
```http
GET /api/loans/stats
```

## 🚀 Deployment

### Backend (Railway/Heroku)

1. **Push to GitHub**
2. **Connect to Railway/Heroku**
3. **Set Environment Variables** (from `.env.example`)
4. **Deploy**

### Frontend (Vercel/Netlify)

1. **Push to GitHub**
2. **Connect to Vercel/Netlify**
3. **Set Environment Variables**
4. **Deploy**

**Important:** Update `VITE_API_URL` to your deployed backend URL

## 🔒 Security Best Practices

### Backend

- ✅ **Never commit `.env`** files
- ✅ **Use environment variables** for all secrets
- ✅ **Validate all inputs** (Ethereum addresses, amounts, etc.)
- ✅ **Rate limiting** (add express-rate-limit in production)
- ✅ **CORS configuration** (restrict to your frontend domain)
- ✅ **MongoDB indexes** for performance
- ✅ **Error handling** without exposing internals

### Frontend

- ✅ **Never expose private keys**
- ✅ **Validate user inputs**
- ✅ **Use HTTPS** in production
- ✅ **Sanitize displayed data**
- ✅ **Handle wallet disconnections**

### Smart Contracts

- ✅ **Audit before mainnet**
- ✅ **Test extensively on testnet**
- ✅ **Use OpenZeppelin libraries**
- ✅ **Implement emergency pause**
- ✅ **Multi-sig for admin functions**

## 🧪 Testing Checklist

### Mock Mode
- [ ] Connect wallet
- [ ] Create loan (WETH)
- [ ] Create loan (WBTC)
- [ ] View positions in "My Positions"
- [ ] Check MongoDB for saved positions
- [ ] Verify health factor calculation
- [ ] Test confetti and toasts

### Production Mode (Sepolia)
- [ ] Get Sepolia ETH from faucet
- [ ] Get WETH/WBTC on Sepolia
- [ ] Approve token spending
- [ ] Execute loan
- [ ] Verify transaction on Etherscan
- [ ] Check position in MongoDB
- [ ] View position in "My Positions"
- [ ] Verify all data matches blockchain

## 📈 Monitoring

### Database Queries

```javascript
// Find all active positions
db.positions.find({ status: 'active' })

// Find positions at risk
db.positions.find({ status: 'active', healthFactor: { $lt: 1.2 } })

// Get user statistics
db.users.findOne({ address: '0x...' })

// Platform totals
db.positions.aggregate([
  { $group: { _id: null, total: { $sum: '$borrowAmount' } } }
])
```

### Logs

```bash
# Backend logs
tail -f backend/logs/app.log

# Check MongoDB connection
# Look for: [INFO] MongoDB Connected
```

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Check connection string format
- Verify IP whitelist in Atlas
- Ensure network connectivity

### Positions Not Saving
- Check backend logs for errors
- Verify all required fields are sent
- Check MongoDB user permissions

### Frontend Can't Connect to Backend
- Verify `VITE_API_URL` is correct
- Check CORS settings in backend
- Ensure backend is running

### MetaMask Not Opening
- Check `VITE_MOCK_MODE` is `false`
- Verify contract addresses are correct
- Ensure user has Sepolia ETH

## 📞 Support

For issues:
1. Check logs (backend and browser console)
2. Verify environment variables
3. Test with Mock Mode first
4. Check MongoDB connection
5. Review this guide

---

**Built with ❤️ for Production-Ready DeFi**
