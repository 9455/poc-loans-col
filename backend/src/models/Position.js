const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
    // User Information
    userAddress: {
        type: String,
        required: true,
        lowercase: true,
        index: true,
        validate: {
            validator: function(v) {
                return /^0x[a-fA-F0-9]{40}$/.test(v);
            },
            message: props => `${props.value} is not a valid Ethereum address!`
        }
    },

    // Loan Details
    protocol: {
        type: String,
        required: true,
        enum: ['Uniswap', 'Aave', 'Lido'],
        index: true
    },
    
    adapterAddress: {
        type: String,
        required: true,
        lowercase: true
    },

    // Collateral
    tokenSymbol: {
        type: String,
        required: true,
        enum: ['WETH', 'WBTC', 'ETH']
    },
    
    tokenAddress: {
        type: String,
        required: true,
        lowercase: true
    },

    collateralAmount: {
        type: Number,
        required: true,
        min: 0
    },

    collateralValueUSD: {
        type: Number,
        required: true,
        min: 0
    },

    // Borrowed Amount
    borrowAmount: {
        type: Number,
        required: true,
        min: 0
    },

    platformFee: {
        type: Number,
        required: true,
        min: 0
    },

    netReceived: {
        type: Number,
        required: true,
        min: 0
    },

    // Loan Terms
    apy: {
        type: String,
        required: true
    },

    ltv: {
        type: Number,
        required: true,
        default: 0.70, // 70%
        min: 0,
        max: 1
    },

    // Blockchain Data
    txHash: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true
    },

    blockNumber: {
        type: Number,
        required: false
    },

    network: {
        type: String,
        required: true,
        default: 'sepolia',
        enum: ['sepolia', 'mainnet', 'polygon', 'arbitrum']
    },

    // Position Status
    status: {
        type: String,
        required: true,
        default: 'active',
        enum: ['active', 'repaid', 'liquidated', 'pending'],
        index: true
    },

    healthFactor: {
        type: Number,
        required: true,
        default: 1.43 // 70% LTV = 1.43 health factor
    },

    // Repayment Data (when applicable)
    repaidAt: {
        type: Date,
        required: false
    },

    repaymentTxHash: {
        type: String,
        required: false,
        lowercase: true
    },

    repaymentAmount: {
        type: Number,
        required: false,
        min: 0
    },

    // Liquidation Data (when applicable)
    liquidatedAt: {
        type: Date,
        required: false
    },

    liquidationTxHash: {
        type: String,
        required: false,
        lowercase: true
    },

    liquidationPrice: {
        type: Number,
        required: false
    },

    // Metadata
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'positions'
});

// Indexes for efficient queries
positionSchema.index({ userAddress: 1, status: 1 });
positionSchema.index({ userAddress: 1, createdAt: -1 });
positionSchema.index({ protocol: 1, status: 1 });
positionSchema.index({ healthFactor: 1, status: 1 }); // For liquidation monitoring

// Virtual for total debt (borrowed + accrued interest - in future implementation)
positionSchema.virtual('totalDebt').get(function() {
    // TODO: Calculate with accrued interest
    return this.borrowAmount;
});

// Method to calculate current health factor based on current price
positionSchema.methods.calculateHealthFactor = function(currentCollateralValueUSD) {
    const liquidationThreshold = 0.80; // 80% of collateral value
    const maxBorrowValue = currentCollateralValueUSD * liquidationThreshold;
    return maxBorrowValue / this.borrowAmount;
};

// Method to check if position is at risk
positionSchema.methods.isAtRisk = function() {
    return this.healthFactor < 1.2; // Below 1.2 is risky
};

// Method to check if position can be liquidated
positionSchema.methods.canBeLiquidated = function() {
    return this.healthFactor < 1.0; // Below 1.0 can be liquidated
};

// Static method to find positions at risk
positionSchema.statics.findAtRisk = function() {
    return this.find({ 
        status: 'active',
        healthFactor: { $lt: 1.2 }
    }).sort({ healthFactor: 1 });
};

// Static method to find liquidatable positions
positionSchema.statics.findLiquidatable = function() {
    return this.find({ 
        status: 'active',
        healthFactor: { $lt: 1.0 }
    }).sort({ healthFactor: 1 });
};

module.exports = mongoose.model('Position', positionSchema);
