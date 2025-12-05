const dexService = require('../services/dexService');
const { client: redisClient } = require('../config/redis');
const logger = require('../utils/logger');

exports.getOpportunities = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ success: false, error: "Token parameter is required" });
        }

        // Try to get from Redis first
        const cachedRates = await redisClient.get(`rates:${token}`);
        if (cachedRates) {
            logger.info(`Serving cached rates for ${token}`);
            return res.json({ success: true, data: JSON.parse(cachedRates) });
        }

        // Fallback to direct fetch if cache miss
        logger.info(`Cache miss for ${token}, fetching directly`);
        const opportunities = await dexService.getRates(token);
        
        // Save to cache
        await redisClient.set(`rates:${token}`, JSON.stringify(opportunities), { EX: 60 });

        res.json({ success: true, data: opportunities });
    } catch (error) {
        logger.error('Error fetching opportunities', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
