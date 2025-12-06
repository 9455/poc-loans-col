const { ethers } = require('ethers');
const logger = require('../utils/logger');
const Position = require('../models/Position');

/**
 * @class LiquidationBot
 * @description Monitors positions and executes liquidations when health factor < 1.0
 */
class LiquidationBot {
    constructor(config) {
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.wallet = new ethers.Wallet(config.privateKey, this.provider);
        this.loanBrokerAddress = config.loanBrokerAddress;
        this.loanBrokerABI = config.loanBrokerABI;
        this.contract = new ethers.Contract(
            this.loanBrokerAddress,
            this.loanBrokerABI,
            this.wallet
        );
        
        this.isRunning = false;
        this.checkInterval = config.checkInterval || 12000; // 12 seconds (1 block)
        this.minProfitUSD = config.minProfitUSD || 50; // Minimum profit to liquidate
        
        logger.info('Liquidation Bot initialized', {
            address: this.wallet.address,
            broker: this.loanBrokerAddress,
            interval: this.checkInterval
        });
    }

    /**
     * Start monitoring positions
     */
    async start() {
        if (this.isRunning) {
            logger.warn('Liquidation bot already running');
            return;
        }

        this.isRunning = true;
        logger.info('🤖 Liquidation Bot started');

        // Listen to new blocks
        this.provider.on('block', async (blockNumber) => {
            try {
                await this.checkPositions(blockNumber);
            } catch (error) {
                logger.error('Error in block listener', error);
            }
        });

        // Also run periodic checks (backup)
        this.intervalId = setInterval(async () => {
            try {
                const blockNumber = await this.provider.getBlockNumber();
                await this.checkPositions(blockNumber);
            } catch (error) {
                logger.error('Error in periodic check', error);
            }
        }, this.checkInterval);
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.provider.removeAllListeners('block');
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        logger.info('🛑 Liquidation Bot stopped');
    }

    /**
     * Check all active positions for liquidation opportunities
     */
    async checkPositions(blockNumber) {
        try {
            // Get all active positions from MongoDB
            const activePositions = await Position.find({ status: 'active' });

            if (activePositions.length === 0) {
                return;
            }

            logger.debug(`Checking ${activePositions.length} active positions`, {
                block: blockNumber
            });

            for (const position of activePositions) {
                await this.checkPosition(position, blockNumber);
            }

        } catch (error) {
            logger.error('Error checking positions', error);
        }
    }

    /**
     * Check a single position
     */
    async checkPosition(position, blockNumber) {
        try {
            // Get on-chain position ID (stored in MongoDB as custom field)
            const onChainPositionId = position.onChainId || this._derivePositionId(position);

            // Get health factor from contract
            const healthFactor = await this.contract.getHealthFactor(onChainPositionId);
            const healthFactorNum = Number(healthFactor) / 1e18;

            // Update MongoDB with current health factor
            position.healthFactor = healthFactorNum;
            await position.save();

            // Check if liquidatable
            if (healthFactorNum < 1.0) {
                logger.warn(`⚠️ Position ${position._id} is liquidatable!`, {
                    user: position.userAddress,
                    healthFactor: healthFactorNum,
                    collateral: position.collateralAmount,
                    token: position.tokenSymbol
                });

                // Calculate profitability
                const isProfitable = await this.isProfitableLiquidation(position);

                if (isProfitable) {
                    await this.liquidatePosition(onChainPositionId, position);
                } else {
                    logger.info('Liquidation not profitable, skipping', {
                        positionId: position._id
                    });
                }
            } else if (healthFactorNum < 1.2) {
                // Send warning (position at risk)
                logger.warn(`⚠️ Position ${position._id} at risk`, {
                    user: position.userAddress,
                    healthFactor: healthFactorNum
                });

                // TODO: Send notification to user (email, push, etc.)
            }

        } catch (error) {
            // Position might not exist on-chain anymore
            if (error.message.includes('Position not active')) {
                logger.info(`Position ${position._id} no longer active on-chain`);
                position.status = 'closed';
                await position.save();
            } else {
                logger.error(`Error checking position ${position._id}`, error);
            }
        }
    }

    /**
     * Check if liquidation is profitable
     */
    async isProfitableLiquidation(position) {
        try {
            // Get current debt
            const onChainPositionId = position.onChainId || this._derivePositionId(position);
            const currentDebt = await this.contract.getCurrentDebt(onChainPositionId);
            const debtUSD = Number(currentDebt) / 1e6; // USDC has 6 decimals

            // Get collateral value (simplified - should use oracle)
            const MOCK_PRICES = {
                WETH: 2500,
                WBTC: 65000
            };
            const collateralValueUSD = position.collateralAmount * MOCK_PRICES[position.tokenSymbol];

            // Get liquidation bonus (5%)
            const config = await this.contract.config();
            const bonusBps = Number(config.liquidationBonusBps);
            const bonus = (collateralValueUSD * bonusBps) / 10000;

            // Calculate profit
            const profit = collateralValueUSD + bonus - debtUSD;

            // Estimate gas cost
            const gasPrice = await this.provider.getFeeData();
            const estimatedGas = 300000; // Estimated gas for liquidation
            const gasCostETH = Number(gasPrice.gasPrice) * estimatedGas / 1e18;
            const gasCostUSD = gasCostETH * MOCK_PRICES.WETH;

            const netProfit = profit - gasCostUSD;

            logger.info('Liquidation profitability analysis', {
                positionId: position._id,
                debtUSD,
                collateralValueUSD,
                bonus,
                profit,
                gasCostUSD,
                netProfit,
                isProfitable: netProfit > this.minProfitUSD
            });

            return netProfit > this.minProfitUSD;

        } catch (error) {
            logger.error('Error calculating profitability', error);
            return false;
        }
    }

    /**
     * Execute liquidation
     */
    async liquidatePosition(onChainPositionId, position) {
        try {
            logger.info(`🔥 Liquidating position ${position._id}`, {
                user: position.userAddress,
                collateral: position.collateralAmount,
                token: position.tokenSymbol
            });

            // Estimate gas
            const gasEstimate = await this.contract.liquidate.estimateGas(onChainPositionId);
            const gasLimit = gasEstimate * 120n / 100n; // 20% buffer

            // Execute liquidation
            const tx = await this.contract.liquidate(onChainPositionId, {
                gasLimit
            });

            logger.info('Liquidation transaction sent', {
                txHash: tx.hash,
                positionId: position._id
            });

            // Wait for confirmation
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                logger.info('✅ Liquidation successful!', {
                    txHash: receipt.hash,
                    positionId: position._id,
                    gasUsed: receipt.gasUsed.toString()
                });

                // Update MongoDB
                position.status = 'liquidated';
                position.liquidatedAt = new Date();
                position.liquidationTxHash = receipt.hash;
                await position.save();

                // TODO: Send notification to user

            } else {
                logger.error('Liquidation transaction failed', {
                    txHash: receipt.hash,
                    positionId: position._id
                });
            }

        } catch (error) {
            logger.error('Error executing liquidation', {
                positionId: position._id,
                error: error.message
            });

            // Check specific errors
            if (error.message.includes('Position is healthy')) {
                logger.warn('Position became healthy before liquidation');
            } else if (error.message.includes('insufficient funds')) {
                logger.error('Bot has insufficient USDC for liquidation');
            }
        }
    }

    /**
     * Derive position ID from MongoDB data
     * @private
     */
    _derivePositionId(position) {
        // This should match how position IDs are stored
        // For now, assuming it's stored in a custom field
        // In production, ensure this mapping is correct
        return position.onChainId || 0;
    }

    /**
     * Get bot status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            botAddress: this.wallet.address,
            brokerAddress: this.loanBrokerAddress,
            checkInterval: this.checkInterval,
            minProfitUSD: this.minProfitUSD
        };
    }
}

module.exports = LiquidationBot;
