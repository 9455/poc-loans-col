require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const FeeService = require('../src/models/FeeService');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dedlyfi_loans');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('DB Connection error:', err);
        process.exit(1);
    }
};

const updateFees = async () => {
    await connectDB();
    try {
        // Set Origination Fee to 0.5%
        await FeeService.findOneAndUpdate(
            { type: 'LOAN_ORIGINATION' },
            { percentage: 0.5, isActive: true },
            { upsert: true }
        );
        console.log('Updated LOAN_ORIGINATION to 0.5%');

        // Set Repayment Fee to 0.5%
        await FeeService.findOneAndUpdate(
            { type: 'LOAN_REPAYMENT' },
            { percentage: 0.5, isActive: true },
            { upsert: true }
        );
        console.log('Updated LOAN_REPAYMENT to 0.5%');
        
    } catch (error) {
        console.error('Error updating fees:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

updateFees();
