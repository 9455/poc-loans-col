const Queue = require('bull');
const logger = require('../utils/logger');
const dexService = require('./dexService');
const { client: redisClient } = require('../config/redis');

// Create a queue for updating rates
const ratesQueue = new Queue('rates-updates', process.env.REDIS_URL || 'redis://localhost:6379');

ratesQueue.process(async (job) => {
    logger.info('Processing rates update job');
    const tokens = ['WETH', 'WBTC'];
    
    for (const token of tokens) {
        try {
            const rates = await dexService.getRates(token);
            // Store in Redis with 5 minute expiry
            await redisClient.set(`rates:${token}`, JSON.stringify(rates), {
                EX: 300
            });
            logger.info(`Updated rates for ${token}`, { count: rates.length });
        } catch (error) {
            logger.error(`Failed to update rates for ${token}`, error);
        }
    }
});

// Add recurring job
const initQueue = async () => {
    // Remove old repeatable jobs to avoid duplicates
    const repeatableJobs = await ratesQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
        await ratesQueue.removeRepeatableByKey(job.key);
    }

    // Add new job running every minute
    await ratesQueue.add({}, {
        repeat: { cron: '* * * * *' }
    });
    
    logger.info('Rates update queue initialized');
    
    // Run immediately on startup
    ratesQueue.add({});
};

module.exports = {
    initQueue,
    ratesQueue
};
