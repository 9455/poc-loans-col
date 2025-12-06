# 🚀 Quick Start Guide - DedlyFi Loans V2

## ⚡ TL;DR - Get Running in 10 Minutes

This guide will get you from zero to a fully functional DeFi lending protocol.

---

## 📋 Prerequisites

```bash
# Check you have these installed
node --version  # v18+
npm --version   # v9+
git --version   # v2+
```

**You'll also need:**
- MetaMask wallet
- Sepolia ETH (get from [faucet](https://sepoliafaucet.com/))
- MongoDB Atlas account (free tier)
- Alchemy API key (optional, for better RPC)

---

## 🏗️ Step 1: Deploy Smart Contracts (5 min)

```bash
# Navigate to contracts
cd contracts

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Your `.env` should have:**
```env
RPC_URL_SEPOLIA=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=your_private_key_here  # WITHOUT 0x prefix
ETHERSCAN_API_KEY=your_etherscan_key  # For verification
```

**Deploy to Sepolia:**
```bash
npx hardhat run scripts/deployV2.js --network sepolia
```

**Expected Output:**
```
🚀 Deploying DedlyFi Loan Protocol V2 to Sepolia...
✅ PriceOracle deployed to: 0x...
✅ LoanBrokerV2 deployed to: 0x...
💾 Deployment info saved to deployment-sepolia.json
```

**Save these addresses!** You'll need them for backend and frontend.

---

## 💾 Step 2: Setup Backend (2 min)

```bash
# Navigate to backend
cd ../backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env
nano .env
```

**Your `.env` should have:**
```env
# MongoDB (get from MongoDB Atlas)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dedlyfi-loans

# Server
PORT=3001

# Blockchain
ACTIVE_NETWORK=sepolia
PRIVATE_KEY=your_private_key_here  # For liquidation bot
RPC_URL_SEPOLIA=https://ethereum-sepolia-rpc.publicnode.com

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379

# Contract Addresses (from Step 1)
LOAN_BROKER_ADDRESS=0x...  # From deployment
PRICE_ORACLE_ADDRESS=0x...  # From deployment

# Tokens (Sepolia)
SEPOLIA_USDC_TOKEN=0xaDD1Fbe72192A8328AeD0EA6E1f729fde11Fd8Ad
SEPOLIA_WETH_TOKEN=0x918530d86c239f92E58A98CE8ed446DC042613DB
SEPOLIA_WBTC_TOKEN=0xA32ecf29Ed19102A639cd1a9706079d055f3CF2B
```

**Start backend:**
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

---

## 🎨 Step 3: Setup Frontend (2 min)

```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env
nano .env
```

**Your `.env` should have:**
```env
# Backend API
VITE_API_URL=http://localhost:3001/api

# Smart Contracts (from Step 1)
VITE_BROKER_ADDRESS=0x...  # LoanBrokerV2 address
VITE_ORACLE_ADDRESS=0x...  # PriceOracle address

# Tokens
VITE_TOKEN_WETH=0x918530d86c239f92E58A98CE8ed446DC042613DB
VITE_TOKEN_WBTC=0xA32ecf29Ed19102A639cd1a9706079d055f3CF2B
VITE_TOKEN_USDC=0xaDD1Fbe72192A8328AeD0EA6E1f729fde11Fd8Ad

# Mock Mode (set to false for real blockchain)
VITE_MOCK_MODE=false
```

**Update ABI:**
```bash
# Copy new ABI from contracts
cp ../contracts/artifacts/contracts/LoanBrokerV2.sol/LoanBrokerV2.json src/abis/LoanBrokerV2.json
```

**Start frontend:**
```bash
npm run dev
```

**Expected Output:**
```
VITE v7.2.6  ready in 120 ms
➜  Local:   http://localhost:5173/
```

---

## 🧪 Step 4: Test the System (1 min)

### **A. Get Test Tokens**

```bash
# Get Sepolia ETH
# Visit: https://sepoliafaucet.com/

# Wrap ETH to WETH
# Visit Sepolia WETH contract on Etherscan
# Call deposit() with some ETH
```

### **B. Fund LoanBroker with USDC**

```bash
# The contract needs USDC to lend
# Transfer some USDC to LoanBrokerV2 address
# Or use a faucet if available
```

### **C. Create Your First Loan**

1. Open `http://localhost:5173`
2. Connect MetaMask (Sepolia network)
3. Select "Borrow against WETH"
4. Enter amount (e.g., 1 WETH)
5. Review terms:
   - Borrow Amount: $1,750 (70% LTV)
   - Platform Fee: $17.50 (1%)
   - You Receive: $1,732.50
6. Click "Confirm Borrow"
7. Approve WETH spending in MetaMask
8. Confirm loan transaction
9. Wait for confirmation
10. See confetti! 🎉

### **D. View Your Position**

1. Click "My Positions" in header
2. See your active loan with:
   - Collateral amount
   - Borrowed amount
   - Health factor
   - Current debt (with interest)

---

## 🤖 Step 5: Start Liquidation Bot (Optional)

```bash
# In backend directory
cd backend

# Create bot script
node -e "
const LiquidationBot = require('./src/services/liquidationBot');
const config = {
    rpcUrl: process.env.RPC_URL_SEPOLIA,
    privateKey: process.env.PRIVATE_KEY,
    loanBrokerAddress: process.env.LOAN_BROKER_ADDRESS,
    loanBrokerABI: require('./src/abis/LoanBrokerV2.json').abi,
    checkInterval: 12000,
    minProfitUSD: 50
};
const bot = new LiquidationBot(config);
bot.start();
console.log('🤖 Liquidation bot started');
process.on('SIGINT', () => { bot.stop(); process.exit(); });
"
```

---

## 🎯 Common Issues & Solutions

### **Issue: "Insufficient USDC balance"**
**Solution:** Fund the LoanBroker contract with USDC
```bash
# Transfer USDC to LoanBrokerV2 address
# Or adjust borrow amount to match available liquidity
```

### **Issue: "Transaction reverted"**
**Solution:** Check:
- You have enough collateral token
- You approved token spending
- LoanBroker has USDC to lend
- Gas price is reasonable

### **Issue: "MongoDB connection failed"**
**Solution:**
- Check connection string format
- Verify IP whitelist in MongoDB Atlas
- Test connection: `mongosh "your_connection_string"`

### **Issue: "Frontend can't connect to backend"**
**Solution:**
- Verify backend is running (`http://localhost:3001/health`)
- Check CORS settings
- Verify `VITE_API_URL` in frontend `.env`

---

## 📊 Verify Everything Works

### **Smart Contracts**
```bash
# Check on Etherscan
https://sepolia.etherscan.io/address/YOUR_LOAN_BROKER_ADDRESS

# Verify contract is deployed
# Check recent transactions
# View contract events
```

### **Backend**
```bash
# Test API
curl http://localhost:3001/health
curl http://localhost:3001/api/loans/opportunities?token=WETH

# Check MongoDB
# Login to MongoDB Atlas
# View "positions" collection
# Should see your loan
```

### **Frontend**
```bash
# Open browser console
# Should see no errors
# Wallet should connect
# Positions should load
```

---

## 🎓 Next Steps

### **Learn More**
- Read `DEFI_BEST_PRACTICES.md` for architecture details
- Read `FEE_STRUCTURE.md` for fee transparency
- Read `IMPLEMENTATION_SUMMARY.md` for complete overview

### **Customize**
- Adjust interest rate in contract
- Change platform fee (max 5%)
- Modify liquidation bonus
- Add more collateral tokens

### **Deploy to Production**
- Get professional audit
- Deploy to mainnet
- Set up monitoring
- Implement governance

---

## 🆘 Need Help?

**Documentation:**
- Smart Contracts: `/contracts/contracts/`
- Backend API: `http://localhost:3001/api-docs`
- Frontend: `/frontend/README.md`

**Common Commands:**
```bash
# Restart everything
cd backend && npm run dev &
cd frontend && npm run dev &

# Check logs
cd backend && tail -f logs/app.log

# Redeploy contracts
cd contracts && npx hardhat run scripts/deployV2.js --network sepolia

# Reset database
# Drop "positions" collection in MongoDB Atlas
```

**Still stuck?**
- Check GitHub issues
- Review error logs
- Verify all environment variables
- Ensure Sepolia ETH balance

---

## ✅ Success Checklist

- [ ] Contracts deployed to Sepolia
- [ ] Backend running and connected to MongoDB
- [ ] Frontend running and connected to backend
- [ ] Wallet connected to Sepolia
- [ ] Test tokens acquired (WETH/WBTC)
- [ ] LoanBroker funded with USDC
- [ ] First loan created successfully
- [ ] Position visible in dashboard
- [ ] Health factor displaying correctly
- [ ] Liquidation bot running (optional)

**Congratulations! 🎉 You now have a production-ready DeFi lending protocol!**

---

**Time to Complete:** ~10 minutes  
**Difficulty:** Intermediate  
**Cost:** Free (testnet only)

*Happy Lending! 🚀*
