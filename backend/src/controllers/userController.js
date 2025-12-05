const User = require('../models/User');
const logger = require('../utils/logger');

exports.connectUser = async (req, res) => {
    try {
        const { address } = req.body;

        if (!address) {
            return res.status(400).json({ success: false, error: "Address is required" });
        }

        const normalizedAddress = address.toLowerCase();

        let user = await User.findOne({ address: normalizedAddress });

        if (user) {
            user.lastLogin = new Date();
            await user.save();
            logger.info(`User login: ${normalizedAddress}`);
        } else {
            user = await User.create({ address: normalizedAddress });
            logger.info(`New user created: ${normalizedAddress}`);
        }

        res.json({ success: true, user });

    } catch (error) {
        logger.error('Error in connectUser', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
