const Queue = require('bull');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const logger = require('../utils/logger');

// ============ Shared Redis Configuration ============

// Parse Redis URL
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const url = new URL(redisUrl);

// Shared Redis configuration for all queues
const sharedRedisConfig = {
    redis: {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: url.password || undefined,
        maxRetriesPerRequest: null, // Required for Bull
        enableReadyCheck: false,
        // Connection pool settings to avoid max clients error
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        }
    },
    // Shared settings for all queues
    settings: {
        lockDuration: 30000,
        stalledInterval: 30000,
        maxStalledCount: 1
    }
};

// ============ Queue Definitions ============

/**
 * Liquidation Queue
 * Monitors positions and executes liquidations
 */
const liquidationQueue = new Queue('liquidation', sharedRedisConfig);

/**
 * Health Factor Update Queue
 * Updates health factors for all active positions
 */
const healthFactorQueue = new Queue('health-factor-update', sharedRedisConfig);

/**
 * Interest Accrual Queue
 * Updates debt with accrued interest
 */
const interestAccrualQueue = new Queue('interest-accrual', sharedRedisConfig);

/**
 * Price Update Queue
 * Fetches latest prices from oracles
 */
const priceUpdateQueue = new Queue('price-update', sharedRedisConfig);

/**
 * Notification Queue
 * Sends notifications to users (email, push, etc.)
 */
const notificationQueue = new Queue('notification', sharedRedisConfig);

// ============ Bull Board Setup ============

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
    queues: [
        new BullAdapter(liquidationQueue),
        new BullAdapter(healthFactorQueue),
        new BullAdapter(interestAccrualQueue),
        new BullAdapter(priceUpdateQueue),
        new BullAdapter(notificationQueue)
    ],
    serverAdapter
});

// ============ Queue Processors ============

/**
 * Process liquidation jobs
 */
liquidationQueue.process(async (job) => {
    const { positionId, userAddress } = job.data;
    
    logger.info('Processing liquidation job', {
        jobId: job.id,
        positionId,
        userAddress
    });

    try {
        const LiquidationBot = require('./liquidationBot');
        const Position = require('../models/Position');
        
        // Get position from DB
        const position = await Position.findById(positionId);
        
        if (!position || position.status !== 'active') {
            logger.warn('Position not active, skipping liquidation', { positionId });
            return { success: false, reason: 'Position not active' };
        }

        // Check if still liquidatable
        const healthFactor = position.healthFactor;
        
        if (healthFactor >= 1.0) {
            logger.info('Position became healthy, skipping liquidation', {
                positionId,
                healthFactor
            });
            return { success: false, reason: 'Position healthy' };
        }

        // Execute liquidation (implementation in liquidationBot)
        // This would call the smart contract
        logger.info('Liquidation would execute here', { positionId });
        
        return {
            success: true,
            positionId,
            healthFactor
        };

    } catch (error) {
        logger.error('Error processing liquidation', error);
        throw error; // Bull will retry
    }
});

/**
 * Process health factor updates
 */
healthFactorQueue.process(async (job) => {
    const { positionIds } = job.data;
    
    logger.info('Processing health factor update', {
        jobId: job.id,
        count: positionIds?.length || 'all'
    });

    try {
        const Position = require('../models/Position');
        
        // Get positions to update
        const query = positionIds 
            ? { _id: { $in: positionIds }, status: 'active' }
            : { status: 'active' };
            
        const positions = await Position.find(query);
        
        let updated = 0;
        let atRisk = 0;
        let liquidatable = 0;

        for (const position of positions) {
            // Calculate new health factor
            // In production, this would call the smart contract or oracle
            const MOCK_PRICES = { WETH: 2500, WBTC: 65000 };
            const collateralValueUSD = position.collateralAmount * MOCK_PRICES[position.tokenSymbol];
            const currentDebt = position.borrowAmount; // Simplified, should include interest
            
            const liquidationThreshold = 0.80;
            const maxBorrowValue = collateralValueUSD * liquidationThreshold;
            const newHealthFactor = maxBorrowValue / currentDebt;

            // Update position
            position.healthFactor = newHealthFactor;
            await position.save();
            updated++;

            // Check if at risk or liquidatable
            if (newHealthFactor < 1.0) {
                liquidatable++;
                
                // Add to liquidation queue
                await liquidationQueue.add({
                    positionId: position._id,
                    userAddress: position.userAddress
                }, {
                    priority: 1, // High priority
                    attempts: 3
                });
                
            } else if (newHealthFactor < 1.2) {
                atRisk++;
                
                // Send warning notification
                await notificationQueue.add({
                    type: 'health-warning',
                    userAddress: position.userAddress,
                    positionId: position._id,
                    healthFactor: newHealthFactor
                }, {
                    attempts: 2
                });
            }
        }

        logger.info('Health factors updated', {
            updated,
            atRisk,
            liquidatable
        });

        return { updated, atRisk, liquidatable };

    } catch (error) {
        logger.error('Error updating health factors', error);
        throw error;
    }
});

/**
 * Process interest accrual
 */
interestAccrualQueue.process(async (job) => {
    logger.info('Processing interest accrual', { jobId: job.id });

    try {
        const Position = require('../models/Position');
        
        // Get all active positions
        const positions = await Position.find({ status: 'active' });
        
        let updated = 0;

        for (const position of positions) {
            // Calculate accrued interest
            // In production, this would read from smart contract
            const daysSinceCreation = (Date.now() - new Date(position.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            const annualRate = 0.05; // 5% APY
            const accruedInterest = position.borrowAmount * (annualRate * daysSinceCreation / 365);
            
            // Update debt (this is for display purposes, real debt is on-chain)
            position.currentDebt = position.borrowAmount + accruedInterest;
            await position.save();
            updated++;
        }

        logger.info('Interest accrued', { updated });

        return { updated };

    } catch (error) {
        logger.error('Error accruing interest', error);
        throw error;
    }
});

/**
 * Process price updates
 */
priceUpdateQueue.process(async (job) => {
    logger.info('Processing price update', { jobId: job.id });

    try {
        // Fetch prices from Chainlink or other oracles
        // Store in cache (Redis) for quick access
        
        const prices = {
            WETH: 2500, // Would fetch from Chainlink
            WBTC: 65000,
            timestamp: Date.now()
        };

        // Store in Redis
        const { client: redisClient } = require('../config/redis');
        await redisClient.set('prices:latest', JSON.stringify(prices), { EX: 300 }); // 5 min cache

        logger.info('Prices updated', prices);

        return prices;

    } catch (error) {
        logger.error('Error updating prices', error);
        throw error;
    }
});

/**
 * Process notifications
 */
notificationQueue.process(async (job) => {
    const { type, userAddress, positionId, healthFactor } = job.data;
    
    logger.info('Processing notification', {
        jobId: job.id,
        type,
        userAddress
    });

    try {
        // Send notification (email, push, SMS, etc.)
        // For now, just log
        
        if (type === 'health-warning') {
            logger.warn(`⚠️ ALERT: Position ${positionId} at risk`, {
                user: userAddress,
                healthFactor
            });
            
            // TODO: Send actual notification
            // - Email via SendGrid
            // - Push notification via Firebase
            // - SMS via Twilio
        }

        return { success: true, type };

    } catch (error) {
        logger.error('Error sending notification', error);
        throw error;
    }
});

// ============ Queue Event Listeners ============

const setupQueueListeners = (queue, name) => {
    queue.on('completed', (job, result) => {
        logger.info(`${name} job completed`, {
            jobId: job.id,
            result
        });
    });

    queue.on('failed', (job, err) => {
        logger.error(`${name} job failed`, {
            jobId: job.id,
            error: err.message
        });
    });

    queue.on('stalled', (job) => {
        logger.warn(`${name} job stalled`, {
            jobId: job.id
        });
    });
};

setupQueueListeners(liquidationQueue, 'Liquidation');
setupQueueListeners(healthFactorQueue, 'HealthFactor');
setupQueueListeners(interestAccrualQueue, 'InterestAccrual');
setupQueueListeners(priceUpdateQueue, 'PriceUpdate');
setupQueueListeners(notificationQueue, 'Notification');

// ============ Scheduled Jobs ============

/**
 * Schedule recurring jobs
 */
const scheduleJobs = () => {
    // Update health factors every 30 seconds
    healthFactorQueue.add({}, {
        repeat: {
            every: 30000 // 30 seconds
        },
        jobId: 'health-factor-update-recurring'
    });

    // Accrue interest every 5 minutes
    interestAccrualQueue.add({}, {
        repeat: {
            every: 300000 // 5 minutes
        },
        jobId: 'interest-accrual-recurring'
    });

    // Update prices every minute
    priceUpdateQueue.add({}, {
        repeat: {
            every: 60000 // 1 minute
        },
        jobId: 'price-update-recurring'
    });

    logger.info('Scheduled jobs initialized');
};

// ============ Exports ============

module.exports = {
    liquidationQueue,
    healthFactorQueue,
    interestAccrualQueue,
    priceUpdateQueue,
    notificationQueue,
    serverAdapter,
    scheduleJobs
};
