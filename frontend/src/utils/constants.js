export const BROKER_ADDRESS = import.meta.env.VITE_BROKER_ADDRESS;

export const TOKENS = {
  WETH: { 
    address: import.meta.env.VITE_TOKEN_WETH, 
    decimals: 18,
    symbol: "WETH",
    icon: "/icons/eth.png"
  },
  WBTC: { 
    address: import.meta.env.VITE_TOKEN_WBTC, 
    decimals: 8,
    symbol: "WBTC",
    icon: "/icons/btc.png"
  },
  USDC: {
    address: import.meta.env.VITE_TOKEN_USDC || '0xd28824F4515fA0FeDD052eA70369EA6175a4e18b', 
    decimals: 6,
    symbol: "USDC",
    icon: "/icons/dedlyfi.png"
  }
};

export const ADAPTERS_MAP = {
  [import.meta.env.VITE_ADAPTER_UNISWAP]: "Uniswap",
  [import.meta.env.VITE_ADAPTER_AAVE]: "Aave",
  [import.meta.env.VITE_ADAPTER_LIDO]: "Lido"
};

export const PROTOCOL_LOGOS = {
  "Uniswap": "/icons/uniswap.png",
  "Aave": "/icons/aave.png",
  "Lido": "/icons/lido.png"
};

export const API_URL = import.meta.env.VITE_API_URL;
