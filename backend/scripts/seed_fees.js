require('dotenv').config(); // Adjust path if running from scripts/
const mongoose = require('mongoose');
const FeeService = require('../src/models/FeeService');
const logger = require('../src/utils/logger');


// DB Connection
const connectDB = async () => {
   try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('MongoDB Connected Successfully');
    } catch (err) {
        logger.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const seedFees = async () => {
    connectDB();

    const fees = [
        {
            type: 'LOAN_ORIGINATION',
            name: 'Origination Fee',
            percentage: 0.00, // 0%
            recipientAddress: process.env.TREASURY_ADDRESS, // Placeholder Treasury
            description: 'Fee charged when a loan is opened (deducted from borrow amount).',
            isActive: true
        },
        {
            type: 'LOAN_REPAYMENT',
            name: 'Service/Repayment Fee',
            percentage: 0.00, // 0%
            recipientAddress: process.env.TREASURY_ADDRESS, // Placeholder Treasury
            description: 'Fee charged when a loan is repaid (added to total due).',
            isActive: true
        }
    ];
    const feeServiceOrigination = new FeeService(fees[0]);
    const feeServiceRepayment = new FeeService(fees[1]);

    try {
        const existsOrigination = await FeeService.findOne({ type: feeServiceOrigination.type });
        if (existsOrigination) {
            logger.info(`Fee ${feeServiceOrigination.type} already exists. Skipping.`);
        } else {
            await FeeService.create(feeServiceOrigination);
            logger.info(`Created fee config: ${feeServiceOrigination.type}`);
        }
        const existsRepayment = await FeeService.findOne({ type: feeServiceRepayment.type });
        if (existsRepayment) {
            logger.info(`Fee ${feeServiceRepayment.type} already exists. Skipping.`);
        } else {
            await FeeService.create(feeServiceRepayment);
            logger.info(`Created fee config: ${feeServiceRepayment.type}`);
        }
        logger.info('Seeding complete.');
    } catch (error) {
        logger.info('Error seeding fees:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

seedFees();
