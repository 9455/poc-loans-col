const mongoose = require('mongoose');

const feeServiceSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        unique: true,
        enum: ['LOAN_ORIGINATION', 'LOAN_REPAYMENT']
    },
    name: {
        type: String,
        required: true
    },
    percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0
    },
    recipientAddress: {
        type: String,
        required: true,
        match: /^0x[a-fA-F0-9]{40}$/
    },
    isActive: {
        type: Boolean,
        default: true
    },
    description: String
}, {
    timestamps: true
});

module.exports = mongoose.model('FeeService', feeServiceSchema);
