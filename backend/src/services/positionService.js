const Position = require('../models/Position');
const User = require('../models/User');
const logger = require('../utils/logger');

class PositionService {
    /**
     * Create a new loan position
     * @param {Object} positionData - Position details
     * @returns {Promise<Object>} Created position
     */
    async createPosition(positionData) {
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
            } = positionData;

            // Validate required fields
            if (!userAddress || !protocol || !tokenSymbol || !collateralAmount || !borrowAmount || !txHash) {
                throw new Error('Missing required fields for position creation');
            }

            // Check if position with this txHash already exists (prevent duplicates)
            const existingPosition = await Position.findOne({ txHash: txHash.toLowerCase() });
            if (existingPosition) {
                logger.warn(`Position with txHash ${txHash} already exists`);
                return existingPosition;
            }

            // Calculate health factor
            const liquidationThreshold = 0.80;
            const maxBorrowValue = collateralValueUSD * liquidationThreshold;
            const healthFactor = maxBorrowValue / borrowAmount;

            // Create position
            const position = new Position({
                userAddress: userAddress.toLowerCase(),
                protocol,
                adapterAddress: adapterAddress.toLowerCase(),
                tokenSymbol,
                tokenAddress: tokenAddress.toLowerCase(),
                collateralAmount,
                collateralValueUSD,
                borrowAmount,
                platformFee,
                netReceived,
                apy,
                ltv: ltv || 0.70,
                txHash: txHash.toLowerCase(),
                blockNumber,
                network: network || 'sepolia',
                status: 'active',
                healthFactor
            });

            await position.save();

            // Update user statistics
            await this.updateUserStats(userAddress, borrowAmount);

            logger.info(`Position created successfully`, {
                positionId: position._id,
                userAddress,
                protocol,
                borrowAmount
            });

            return position;

        } catch (error) {
            logger.error('Error creating position', error);
            throw error;
        }
    }

    /**
     * Get all positions for a user
     * @param {string} userAddress - User's Ethereum address
     * @param {Object} filters - Optional filters (status, protocol, etc.)
     * @returns {Promise<Array>} User's positions
     */
    async getUserPositions(userAddress, filters = {}) {
        try {
            const query = { userAddress: userAddress.toLowerCase() };

            // Apply filters
            if (filters.status) {
                query.status = filters.status;
            }
            if (filters.protocol) {
                query.protocol = filters.protocol;
            }

            const positions = await Position.find(query)
                .sort({ createdAt: -1 })
                .lean();

            // logger.info(`Fetched ${positions.length} positions for ${userAddress}`);

            return positions;

        } catch (error) {
            logger.error('Error fetching user positions', error);
            throw error;
        }
    }

    /**
     * Get a single position by ID
     * @param {string} positionId - Position ID
     * @returns {Promise<Object>} Position details
     */
    async getPositionById(positionId) {
        try {
            const position = await Position.findById(positionId);
            
            if (!position) {
                throw new Error(`Position ${positionId} not found`);
            }

            return position;

        } catch (error) {
            logger.error('Error fetching position by ID', error);
            throw error;
        }
    }

    /**
     * Update position health factor
     * @param {string} positionId - Position ID
     * @param {number} newCollateralValueUSD - Updated collateral value
     * @returns {Promise<Object>} Updated position
     */
    async updateHealthFactor(positionId, newCollateralValueUSD) {
        try {
            const position = await Position.findById(positionId);
            
            if (!position) {
                throw new Error(`Position ${positionId} not found`);
            }

            const newHealthFactor = position.calculateHealthFactor(newCollateralValueUSD);
            
            position.healthFactor = newHealthFactor;
            position.collateralValueUSD = newCollateralValueUSD;
            await position.save();

            logger.info(`Health factor updated for position ${positionId}`, {
                oldHealthFactor: position.healthFactor,
                newHealthFactor,
                collateralValueUSD: newCollateralValueUSD
            });

            return position;

        } catch (error) {
            logger.error('Error updating health factor', error);
            throw error;
        }
    }

    /**
     * Mark position as repaid
     * @param {string} positionId - Position ID
     * @param {Object} repaymentData - Repayment details
     * @returns {Promise<Object>} Updated position
     */
    async repayPosition(positionId, repaymentData) {
        try {
            const { repaymentTxHash, repaymentAmount } = repaymentData;

            const position = await Position.findById(positionId);
            
            if (!position) {
                throw new Error(`Position ${positionId} not found`);
            }

            if (position.status !== 'active') {
                throw new Error(`Position ${positionId} is not active`);
            }

            position.status = 'repaid';
            position.repaidAt = new Date();
            position.repaymentTxHash = repaymentTxHash.toLowerCase();
            position.repaymentAmount = repaymentAmount;
            
            await position.save();

            // Update user statistics
            const user = await User.findOne({ address: position.userAddress });
            if (user) {
                await user.recordRepayment(repaymentAmount);
            }

            logger.info(`Position ${positionId} marked as repaid`);

            return position;

        } catch (error) {
            logger.error('Error repaying position', error);
            throw error;
        }
    }

    /**
     * Get positions at risk of liquidation
     * @returns {Promise<Array>} At-risk positions
     */
    async getAtRiskPositions() {
        try {
            const positions = await Position.findAtRisk();
            
            logger.info(`Found ${positions.length} at-risk positions`);

            return positions;

        } catch (error) {
            logger.error('Error fetching at-risk positions', error);
            throw error;
        }
    }

    /**
     * Get liquidatable positions
     * @returns {Promise<Array>} Liquidatable positions
     */
    async getLiquidatablePositions() {
        try {
            const positions = await Position.findLiquidatable();
            
            logger.info(`Found ${positions.length} liquidatable positions`);

            return positions;

        } catch (error) {
            logger.error('Error fetching liquidatable positions', error);
            throw error;
        }
    }

    /**
     * Update user statistics
     * @param {string} userAddress - User's Ethereum address
     * @param {number} borrowAmount - Amount borrowed
     * @private
     */
    async updateUserStats(userAddress, borrowAmount) {
        try {
            let user = await User.findOne({ address: userAddress.toLowerCase() });

            if (!user) {
                // Create new user
                user = new User({
                    address: userAddress.toLowerCase()
                });
            }

            await user.incrementPositions(borrowAmount);

            logger.info(`User stats updated for ${userAddress}`);

        } catch (error) {
            logger.error('Error updating user stats', error);
            // Don't throw - this is not critical
        }
    }

    /**
     * Get platform statistics
     * @returns {Promise<Object>} Platform stats
     */
    async getPlatformStats() {
        try {
            const [
                totalPositions,
                activePositions,
                totalBorrowed,
                totalRepaid,
                atRiskCount,
                liquidatableCount
            ] = await Promise.all([
                Position.countDocuments(),
                Position.countDocuments({ status: 'active' }),
                Position.aggregate([
                    { $group: { _id: null, total: { $sum: '$borrowAmount' } } }
                ]),
                Position.aggregate([
                    { $match: { status: 'repaid' } },
                    { $group: { _id: null, total: { $sum: '$repaymentAmount' } } }
                ]),
                Position.countDocuments({ status: 'active', healthFactor: { $lt: 1.2 } }),
                Position.countDocuments({ status: 'active', healthFactor: { $lt: 1.0 } })
            ]);

            return {
                totalPositions,
                activePositions,
                totalBorrowed: totalBorrowed[0]?.total || 0,
                totalRepaid: totalRepaid[0]?.total || 0,
                atRiskCount,
                liquidatableCount
            };

        } catch (error) {
            logger.error('Error fetching platform stats', error);
            throw error;
        }
    }
}

module.exports = new PositionService();
