const mongoose = require('mongoose');
const FeeService = require('../src/models/FeeService');
require('dotenv').config();
// REAL DEPLOYED CONTRACT
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;
// CONFIGURATION
const LOAN_ORIGINATION_FEE = 1.0; // 1%
const LOAN_REPAYMENT_FEE = 0.0;   // 0%

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected Successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const updateFees = async () => {
    connectDB();
    try {
        console.log(`📡 Updating Fee Services with Real Treasury Contract: ${TREASURY_ADDRESS}`);

        // Update Origination Fee
        await FeeService.findOneAndUpdate(
            { type: 'LOAN_ORIGINATION' },
            { 
                percentage: LOAN_ORIGINATION_FEE, 
                recipientAddress: TREASURY_ADDRESS,
                description: 'Fee charged at loan origination, sent to FeeTreasury contract.'
            },
            { new: true }
        );
        console.log(`✅ LOAN_ORIGINATION: ${LOAN_ORIGINATION_FEE}% -> Treasury: ${TREASURY_ADDRESS}`);

        // Update Repayment Fee
        const feeService = await FeeService.findOne({ type: 'LOAN_REPAYMENT' });
        await FeeService.findOneAndUpdate(
            { type: 'LOAN_REPAYMENT' },
            { 
                percentage: LOAN_REPAYMENT_FEE, 
                recipientAddress: TREASURY_ADDRESS,
                description: 'Fee charged at repayment, sent to FeeTreasury contract.'
            },
            { new: true }
        );
        console.log(`✅ LOAN_REPAYMENT: ${LOAN_REPAYMENT_FEE}% -> Treasury: ${TREASURY_ADDRESS}`);
        
    } catch (error) {
        console.error('❌ Error updating fees:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

updateFees();
