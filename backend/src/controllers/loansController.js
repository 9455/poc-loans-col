const dexService = require('../services/dexService');
const positionService = require('../services/positionService');
const { client: redisClient } = require('../config/redis');
const logger = require('../utils/logger');

const Opportunity = require('../models/Opportunity');

exports.getOpportunities = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ success: false, error: "Token parameter is required" });
        }

        // 1. Try to get from MongoDB (Source of Truth)
        let mongoOpportunities = await Opportunity.find({ 
            token: token,
            isActive: true 
        }).sort({ lastUpdated: -1 });

        // If data is recent inside DB (e.g., less than 5 minutes old), return it
        // For PoC, we might want to refresh if empty or older than threshold
        const isDataFresh = mongoOpportunities.length > 0 && 
            (Date.now() - new Date(mongoOpportunities[0].lastUpdated).getTime() < 5 * 60 * 1000);

        if (isDataFresh) {
            logger.info(`Serving fresh opportunities from MongoDB for ${token}`);
            // Format for frontend consistency if needed, or return directly
            return res.json({ success: true, data: mongoOpportunities });
        }

        // 2. If no data or stale, fetch from DexService (Live/Mock)
        logger.info(`Fetching live opportunities for ${token}`);
        const liveOpportunities = await dexService.getRates(token);
        
        // 3. Update MongoDB
        const bulkOps = liveOpportunities.map(opp => ({
            updateOne: {
                filter: { protocol: opp.protocol, token: token },
                update: { 
                    $set: { 
                        apy: opp.apy,
                        risk: opp.risk,
                        tvl: opp.tvl,
                        lastUpdated: new Date()
                    }
                },
                upsert: true
            }
        }));

        if (bulkOps.length > 0) {
            await Opportunity.bulkWrite(bulkOps);
        }
        
        // 4. Update Redis for caching (optional but good for high traffic)
        await redisClient.set(`rates:${token}`, JSON.stringify(liveOpportunities), { EX: 60 });

        res.json({ success: true, data: liveOpportunities });
    } catch (error) {
        logger.error('Error fetching opportunities', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

exports.createPosition = async (req, res) => {
    try {
        const { 
            userAddress, 
            protocol,
            adapterAddress,
            tokenSymbol,
            tokenAddress,
            collateralAmount,
            collateralValueUSD,
            borrowAmount,
            platformFee,
            netReceived,
            apy,
            ltv,
            txHash,
            blockNumber,
            network
        } = req.body;

        // Validation
        if (!userAddress || !protocol || !tokenSymbol || !collateralAmount || !borrowAmount || !txHash) {
            return res.status(400).json({ 
                success: false, 
                error: "Missing required fields: userAddress, protocol, tokenSymbol, collateralAmount, borrowAmount, txHash" 
            });
        }

        // Validate Ethereum address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
            return res.status(400).json({ 
                success: false, 
                error: "Invalid Ethereum address format" 
            });
        }

        // Validate transaction hash format
        if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
            return res.status(400).json({ 
                success: false, 
                error: "Invalid transaction hash format" 
            });
        }

        // Fetch Origination Fee Config
        const FeeService = require('../models/FeeService');
        const feeConfig = await FeeService.findOne({ type: 'LOAN_ORIGINATION', isActive: true });
        const serviceFeeRate = feeConfig ? (feeConfig.percentage / 100) : 0; 

        // Calculate Official Backend Fee
        const calculatedFee = parseFloat(borrowAmount) * serviceFeeRate;
        
        // Create position using service
        const position = await positionService.createPosition({
            userAddress,
            protocol,
            adapterAddress,
            tokenSymbol,
            tokenAddress,
            collateralAmount: parseFloat(collateralAmount),
            collateralValueUSD: parseFloat(collateralValueUSD),
            borrowAmount: parseFloat(borrowAmount),
            platformFee: calculatedFee, // Use trusted backend calculation
            feeRecipient: feeConfig?.recipientAddress,
            netReceived: parseFloat(borrowAmount) - calculatedFee,
            apy,
            ltv: parseFloat(ltv || 0.70),
            txHash,
            blockNumber: blockNumber ? parseInt(blockNumber) : undefined,
            network: network || 'sepolia'
        });

        logger.info(`Position created successfully`, {
            positionId: position._id,
            userAddress,
            txHash,
            feeApplied: calculatedFee
        });

        res.status(201).json({ 
            success: true, 
            position: {
                id: position._id,
                userAddress: position.userAddress,
                protocol: position.protocol,
                tokenSymbol: position.tokenSymbol,
                collateralAmount: position.collateralAmount,
                borrowAmount: position.borrowAmount,
                netReceived: position.netReceived,
                platformFee: position.platformFee,
                apy: position.apy,
                txHash: position.txHash,
                status: position.status,
                healthFactor: position.healthFactor,
                createdAt: position.createdAt
            }
        });

    } catch (error) {
        logger.error('Error creating position', error);
        
        // Handle duplicate txHash error
        if (error.code === 11000) {
            return res.status(409).json({ 
                success: false, 
                error: 'Position with this transaction hash already exists' 
            });
        }

        res.status(500).json({ 
            success: false, 
            error: 'Failed to create position',
            message: error.message 
        });
    }
};

exports.getUserPositions = async (req, res) => {
    try {
        const { address } = req.params;
        const { status, protocol } = req.query;

        if (!address) {
            return res.status(400).json({ success: false, error: "Address is required" });
        }

        // Validate Ethereum address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return res.status(400).json({ 
                success: false, 
                error: "Invalid Ethereum address format" 
            });
        }

        // Build filters
        const filters = {};
        if (status) filters.status = status;
        if (protocol) filters.protocol = protocol;

        const positions = await positionService.getUserPositions(address, filters);

        // logger.info(`Fetched ${positions.length} positions for ${address}`, { filters });

        res.json({ 
            success: true, 
            count: positions.length,
            positions: positions.map(p => ({
                id: p._id,
                protocol: p.protocol,
                tokenSymbol: p.tokenSymbol,
                collateralAmount: p.collateralAmount,
                collateralValueUSD: p.collateralValueUSD, // Added missing field
                borrowAmount: p.borrowAmount,
                netReceived: p.netReceived,
                apy: p.apy,
                txHash: p.txHash,
                status: p.status,
                healthFactor: p.healthFactor,
                createdAt: p.createdAt
            }))
        });

    } catch (error) {
        logger.error('Error fetching user positions', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch positions',
            message: error.message 
        });
    }
};

exports.getPositionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, error: "Position ID is required" });
        }

        const position = await positionService.getPositionById(id);

        res.json({ success: true, position });

    } catch (error) {
        logger.error('Error fetching position by ID', error);
        
        if (error.message.includes('not found')) {
            return res.status(404).json({ 
                success: false, 
                error: 'Position not found' 
            });
        }

        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch position',
            message: error.message 
        });
    }
};

exports.getPlatformStats = async (req, res) => {
    try {
        const stats = await positionService.getPlatformStats();

        res.json({ success: true, stats });

    } catch (error) {
        logger.error('Error fetching platform stats', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch platform statistics',
            message: error.message 
        });
    }
};

// Get Fees Configuration
exports.getFeesConfig = async (req, res) => {
    try {
        const FeeService = require('../models/FeeService');
        const fees = await FeeService.find({ isActive: true });
        
        // Transform to easy object map
        const config = fees.reduce((acc, fee) => {
            acc[fee.type] = {
                percentage: fee.percentage,
                recipient: fee.recipientAddress
            };
            return acc;
        }, {});

        res.json({ success: true, config });
    } catch (error) {
        logger.error('Error fetching fees config:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch fees' });
    }
};

exports.repayPosition = async (req, res) => {
    try {
        const Position = require('../models/Position'); 
        const FeeService = require('../models/FeeService');
        const { id } = req.params;
        const { txHash } = req.body;

        const position = await Position.findById(id);

        if (!position) {
            return res.status(404).json({ success: false, error: 'Position not found' });
        }

        if (position.status !== 'active') {
            return res.status(400).json({ success: false, error: 'Position is not active' });
        }

        // 1. Calculate Interest Accrued
        const apyRate = parseFloat(position.apy.replace('%', '')) / 100;
        
        const now = new Date();
        const created = new Date(position.createdAt);
        const timeDiffMs = now - created;
        
        // Effective time in years. Min 1 hour for PoC demo
        const effectiveTime = Math.max(timeDiffMs / (1000 * 60 * 60 * 24 * 365), 1 / (365 * 24)); 
        
        // Fetch Service Fee from DB
        const feeConfig = await FeeService.findOne({ type: 'LOAN_REPAYMENT', isActive: true });
        const serviceFeePercent = feeConfig ? (feeConfig.percentage / 100) : 0; // DB stores 0.5 for 0.5%, so divide by 100

        const principal = position.borrowAmount;
        const accruedInterest = principal * apyRate * effectiveTime;
        const serviceFee = principal * serviceFeePercent;
        const totalDue = principal + accruedInterest + serviceFee;
        
        // 2. Perform Full Repayment (Always close position in this version)
        position.status = 'repaid';
        position.repaidAt = now;
        position.repayTxHash = txHash || '0xSimulatedHash...';
        position.finalInterestPaid = accruedInterest;
        position.serviceFeePaid = serviceFee; // Store fee paid
        position.feeRecipient = feeConfig?.recipientAddress; // Store who received it
        
        await position.save();

        // Clear Redis cache
        if (redisClient.isOpen) {
            await redisClient.del(`user_positions:${position.userAddress.toLowerCase()}`);
        }

        return res.json({
            success: true,
            message: 'Loan fully repaid',
            repaidAmount: totalDue,
            collateralReleased: position.collateralAmount,
            type: 'full'
        });

    } catch (error) {
        logger.error('Error repaying position:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Repayment failed',
            message: error.message 
        });
    }
};
