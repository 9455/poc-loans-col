# DedlyFi - Collateral Loans PoC (Backend)

## 📋 Overview
Backend API for the DedlyFi Collateral Loans Proof of Concept. Provides loan opportunities from multiple DeFi protocols and tracks user positions.

## 🚀 Features
- **Multi-Protocol Aggregation**: Fetches rates from Uniswap, Aave, and Lido
- **RESTful API**: Express.js server with CORS support
- **User Management**: Tracks wallet connections and loan history
- **Opportunity Discovery**: Returns best borrow rates for WETH and WBTC

## 🛠 Tech Stack
- **Node.js** + **Express**
- **CORS** (Cross-Origin Resource Sharing)
- **In-Memory Storage** (for PoC - no database required)

## 📦 Installation

```bash
npm install
```

## ⚙️ Configuration

Create a `.env` file in the root directory (if needed for future expansion):

```env
PORT=3001
```

Currently, the backend uses hardcoded mock data for opportunities. In production, this would query on-chain data.

## 🏃‍♂️ Running the Server

### Development Mode
```bash
npm run dev
```

The server will start on `http://localhost:3001`.

### Production Mode
```bash
node index.js
```

## 📡 API Endpoints

### `GET /api/opportunities`
Fetch available loan opportunities for a specific token.

**Query Parameters:**
- `token` (required): `WETH` or `WBTC`

**Example Request:**
```bash
curl http://localhost:3001/api/opportunities?token=WETH
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "protocol": "Uniswap",
      "adapter": "0x5e01a1cBdfddA63D20d74E121B778d87A5AC0178",
      "apy": "5.38%",
      "tvl": "$2.5M",
      "risk": "Low",
      "logo": "/icons/uniswap.png"
    },
    {
      "protocol": "Aave",
      "adapter": "0xFbe1cE67358c2333663738020F861438B7FAe929",
      "apy": "1.67%",
      "tvl": "$8.2M",
      "risk": "Low",
      "logo": "/icons/aave.png"
    }
  ]
}
```

### `POST /api/users/connect`
Register or update a user's wallet connection.

**Request Body:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered",
  "user": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "connectedAt": "2025-12-05T14:30:00.000Z"
  }
}
```

### `GET /api/users/:address/positions`
Fetch active loan positions for a user (placeholder for future implementation).

**Example Request:**
```bash
curl http://localhost:3001/api/users/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/positions
```

**Response:**
```json
{
  "success": true,
  "positions": []
}
```

## 📁 Project Structure

```
backend/
├── index.js           # Main Express server
├── package.json       # Dependencies
├── .env               # Environment variables (optional)
└── README.md          # This file
```

## 🔑 Key Logic

### Opportunity Data
Currently uses **mock data** for demonstration purposes. In production, this would:
1. Query on-chain lending protocols via ethers.js/viem
2. Fetch real-time APY from protocol contracts
3. Calculate TVL from pool reserves
4. Assess risk based on protocol audits and historical data

### User Tracking
Stores users in-memory (resets on server restart). For production:
- Use a database (PostgreSQL, MongoDB)
- Track loan history and positions
- Implement authentication/authorization

## 🚧 Known Limitations (PoC)

- **Mock Data**: Opportunities are hardcoded, not fetched from blockchain
- **No Database**: User data is lost on server restart
- **No Authentication**: Anyone can call endpoints
- **No Rate Limiting**: Vulnerable to spam in production

## 🔮 Roadmap to Production

1. **Integrate Blockchain Queries**: Use ethers.js to fetch real APYs and TVLs
2. **Add Database**: PostgreSQL for user positions and loan history
3. **Implement Auth**: JWT tokens or wallet signature verification
4. **Add Monitoring**: Logging, error tracking (Sentry, Datadog)
5. **Deploy**: Railway, Heroku, or AWS
6. **Add Caching**: Redis for frequently accessed data

## 🧪 Testing

### Manual Testing
```bash
# Start server
npm run dev

# Test opportunities endpoint
curl http://localhost:3001/api/opportunities?token=WETH

# Test user connection
curl -X POST http://localhost:3001/api/users/connect \
  -H "Content-Type: application/json" \
  -d '{"address":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
```

### Future: Automated Tests
Add Jest or Mocha for unit/integration tests.

## 📞 Support

For issues or questions, contact the development team or check the main project README.

---

**Built with ❤️ by the DedlyFi Team**
