const User = require('../models/User');
const logger = require('../utils/logger');

exports.connectUser = async (req, res) => {
    try {
        const { address } = req.body;

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

        const normalizedAddress = address.toLowerCase();

        let user = await User.findOne({ address: normalizedAddress });

        if (user) {
            // Update connection
            await user.recordConnection();
            logger.info(`User reconnected: ${normalizedAddress}`, {
                connectionCount: user.connectionCount
            });
        } else {
            // Create new user
            user = await User.create({ address: normalizedAddress });
            logger.info(`New user created: ${normalizedAddress}`);
        }

        res.json({ 
            success: true, 
            message: user.connectionCount === 1 ? 'User registered' : 'User reconnected',
            user: {
                address: user.address,
                totalPositions: user.totalPositions,
                activePositions: user.activePositions,
                connectionCount: user.connectionCount,
                firstConnectedAt: user.firstConnectedAt,
                lastConnectedAt: user.lastConnectedAt
            }
        });

    } catch (error) {
        logger.error('Error in connectUser', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal Server Error',
            message: error.message 
        });
    }
};
