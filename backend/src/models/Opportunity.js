const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
    protocol: {
        type: String,
        required: true,
        enum: ['Uniswap', 'Aave', 'Lido']
    },
    token: {
        type: String,
        required: true,
        enum: ['WETH', 'WBTC', 'USDC']
    },
    apy: {
        type: String, // String to preserve formatting like "5.38%"
        required: true
    },
    risk: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low'
    },
    tvl: {
        type: String, // e.g., "$1.2B"
        required: true
    },
    maxLTV: {
        type: Number,
        default: 0.70 // 70%
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Keep track of historical changes if needed, but for now we just want latest
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Composite index to efficiently find opportunity by protocol and token
opportunitySchema.index({ protocol: 1, token: 1 }, { unique: true });

module.exports = mongoose.model('Opportunity', opportunitySchema);
