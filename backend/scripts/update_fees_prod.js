const mongoose = require('mongoose');
const FeeService = require('../src/models/FeeService');

// CONSTANTS
const TREASURY_ADDRESS = '0xFeebc1e000000000000000000000000000000000'; // Placeholder - Update after deploy
const LOAN_ORIGINATION_FEE = 1.0; // 1%
const LOAN_REPAYMENT_FEE = 0.0;   // 0%

const connectDB = async () => {
    try {
       await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('DB Connection error:', err);
        process.exit(1);
    }
};

const updateFees = async () => {
    await connectDB();
    try {
        console.log(`Setting Treasury Address to: ${TREASURY_ADDRESS}`);

        // Update Origination Fee (1%)
        await FeeService.findOneAndUpdate(
            { type: 'LOAN_ORIGINATION' },
            { 
                percentage: LOAN_ORIGINATION_FEE, 
                recipientAddress: TREASURY_ADDRESS,
                isActive: true,
                description: 'Fee charged at loan origination (deducted from principal).'
            },
            { upsert: true, new: true }
        );
        console.log(`✅ Updated LOAN_ORIGINATION to ${LOAN_ORIGINATION_FEE}%`);

        // Update Repayment Fee (0%)
        await FeeService.findOneAndUpdate(
            { type: 'LOAN_REPAYMENT' },
            { 
                percentage: LOAN_REPAYMENT_FEE, 
                recipientAddress: TREASURY_ADDRESS,
                isActive: true,
                description: 'Fee charged at loan repayment (added to total due).'
            },
            { upsert: true, new: true }
        );
        console.log(`✅ Updated LOAN_REPAYMENT to ${LOAN_REPAYMENT_FEE}%`);
        
    } catch (error) {
        console.error('❌ Error updating fees:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

updateFees();
