const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true,
        validate: {
            validator: function(v) {
                return /^0x[a-fA-F0-9]{40}$/.test(v);
            },
            message: props => `${props.value} is not a valid Ethereum address!`
        }
    },

    // User Statistics
    totalPositions: {
        type: Number,
        default: 0,
        min: 0
    },

    activePositions: {
        type: Number,
        default: 0,
        min: 0
    },

    totalBorrowed: {
        type: Number,
        default: 0,
        min: 0
    },

    totalRepaid: {
        type: Number,
        default: 0,
        min: 0
    },

    // Connection History
    firstConnectedAt: {
        type: Date,
        default: Date.now
    },

    lastConnectedAt: {
        type: Date,
        default: Date.now
    },

    connectionCount: {
        type: Number,
        default: 1,
        min: 0
    },

    // Metadata
    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'users'
});

// Method to update connection
userSchema.methods.recordConnection = function() {
    this.lastConnectedAt = new Date();
    this.connectionCount += 1;
    return this.save();
};

// Method to increment position count
userSchema.methods.incrementPositions = function(borrowAmount) {
    this.totalPositions += 1;
    this.activePositions += 1;
    this.totalBorrowed += borrowAmount;
    return this.save();
};

// Method to record repayment
userSchema.methods.recordRepayment = function(repaymentAmount) {
    this.activePositions = Math.max(0, this.activePositions - 1);
    this.totalRepaid += repaymentAmount;
    return this.save();
};

module.exports = mongoose.model('User', userSchema);
