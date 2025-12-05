const axios = require('axios');
const logger = require('../utils/logger');

class DexService {
    async getRates(token) {
        // In a real scenario, this would fetch from TheGraph, chainlink, or specific protocol APIs
        // For PoC, we default to mocked but realistic looking dynamic data
        // We could use the provided API URLs if they work, but often they need specific query params

        const baseRates = {
            'WETH': {
                'Uniswap': 5.2,
                'Aave': 1.8,
                'Lido': 3.5
            },
            'WBTC': {
                'Uniswap': 3.1,
                'Aave': 0.5,
                'Lido': 0 // Lido doesnt do BTC
            }
        };

        // Add some random fluctuation to simulate live data
        const fluctuate = (base) => {
            if (base === 0) return 0;
            return (base + (Math.random() * 0.5 - 0.25)).toFixed(2);
        };

        const tokenRates = baseRates[token] || {};
        
        // Try fetching Lido real data for ETH
        let lidoRate = tokenRates['Lido'];
        if (token === 'WETH' && process.env.LIDO_API_URL) {
            try {
                const res = await axios.get(process.env.LIDO_API_URL);
                if (res.data && res.data.apr) {
                    lidoRate = res.data.apr;
                }
            } catch (e) {
                logger.warn('Failed to fetch Lido stats', e.message);
            }
        }

        return [
            {
                protocol: 'Uniswap',
                apy: `${fluctuate(tokenRates['Uniswap'])}%`,
                tvl: `$${(Math.random() * 100 + 50).toFixed(2)}M`,
                risk: 'Medium',
                adapter: process.env.ADAPTER_UNISWAP,
                logo: '/icons/uniswap.png'
            },
            {
                protocol: 'Aave',
                apy: `${fluctuate(tokenRates['Aave'])}%`,
                tvl: `$${(Math.random() * 50 + 10).toFixed(2)}B`,
                risk: 'Low',
                adapter: process.env.ADAPTER_AAVE,
                logo: '/icons/aave.png'
            },
            ...(token === 'WETH' ? [{
                protocol: 'Lido',
                apy: `${Number(lidoRate).toFixed(2)}%`,
                tvl: '$26.77B',
                risk: 'Low',
                adapter: process.env.ADAPTER_LIDO,
                logo: '/icons/lido.png'
            }] : [])
        ];
    }
}

module.exports = new DexService();
