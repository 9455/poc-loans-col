const { createClient } = require('redis');
const logger = require('../utils/logger');

const client = createClient({
    url: process.env.REDIS_URL
});

client.on('error', (err) => logger.error('Redis Client Error', err));
client.on('connect', () => logger.info('Redis Client Connected'));

const connectRedis = async () => {
    if (!client.isOpen) {
        await client.connect();
    }
};

module.exports = {
    client,
    connectRedis
};
