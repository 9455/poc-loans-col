// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IPriceOracle
 * @notice Interface for price oracle
 */
interface IPriceOracle {
    function getPrice(address token) external view returns (uint256);
    function getPriceWithDecimals(address token) external view returns (uint256 price, uint8 decimals);
}

/**
 * @title AggregatorV3Interface
 * @notice Chainlink price feed interface
 */
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

/**
 * @title PriceOracle
 * @notice Chainlink-based price oracle with fallback mechanism
 * @dev Returns prices in USD with 18 decimals
 */
contract PriceOracle is IPriceOracle, Ownable {
    
    // ============ State Variables ============
    
    mapping(address => address) public priceFeeds;
    mapping(address => uint256) public fallbackPrices;
    
    uint256 public constant PRICE_PRECISION = 1e18;
    uint256 public constant STALENESS_THRESHOLD = 3600; // 1 hour
    
    // ============ Events ============
    
    event PriceFeedUpdated(address indexed token, address indexed priceFeed);
    event FallbackPriceUpdated(address indexed token, uint256 price);
    event PriceRetrieved(address indexed token, uint256 price, bool usedFallback);
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        // Sepolia Testnet Chainlink Price Feeds
        // ETH/USD
        priceFeeds[0x918530d86c239f92E58A98CE8ed446DC042613DB] = 0x694AA1769357215DE4FAC081bf1f309aDC325306;
        
        // BTC/USD
        priceFeeds[0xA32ecf29Ed19102A639cd1a9706079d055f3CF2B] = 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43;
        
        // Set fallback prices (in case Chainlink fails)
        fallbackPrices[0x918530d86c239f92E58A98CE8ed446DC042613DB] = 2500 * PRICE_PRECISION; // $2500
        fallbackPrices[0xA32ecf29Ed19102A639cd1a9706079d055f3CF2B] = 65000 * PRICE_PRECISION; // $65000
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Get price of a token in USD (18 decimals)
     * @param token Address of the token
     * @return price Price in USD with 18 decimals
     */
    function getPrice(address token) external view override returns (uint256 price) {
        address priceFeed = priceFeeds[token];
        
        if (priceFeed == address(0)) {
            // No price feed configured, use fallback
            price = fallbackPrices[token];
            require(price > 0, "No price available");
            return price;
        }
        
        try this._getChainlinkPrice(priceFeed) returns (uint256 chainlinkPrice, bool isStale) {
            if (!isStale) {
                return chainlinkPrice;
            }
        } catch {
            // Chainlink call failed
        }
        
        // Use fallback price
        price = fallbackPrices[token];
        require(price > 0, "No fallback price");
        
        return price;
    }
    
    /**
     * @notice Get price with decimals info
     * @param token Address of the token
     * @return price Price in USD
     * @return decimals Number of decimals (always 18)
     */
    function getPriceWithDecimals(address token) external view override returns (uint256 price, uint8 decimals) {
        price = this.getPrice(token);
        decimals = 18;
    }
    
    /**
     * @notice Get Chainlink price (public for try/catch)
     * @param priceFeed Address of Chainlink price feed
     * @return price Price in USD with 18 decimals
     * @return isStale Whether the price is stale
     */
    function _getChainlinkPrice(address priceFeed) external view returns (uint256 price, bool isStale) {
        AggregatorV3Interface feed = AggregatorV3Interface(priceFeed);
        
        (
            uint80 roundId,
            int256 answer,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = feed.latestRoundData();
        
        require(answer > 0, "Invalid price");
        require(answeredInRound >= roundId, "Stale price");
        
        // Check if price is stale
        isStale = (block.timestamp - updatedAt) > STALENESS_THRESHOLD;
        
        // Convert to 18 decimals
        uint8 feedDecimals = feed.decimals();
        price = uint256(answer);
        
        if (feedDecimals < 18) {
            price = price * (10 ** (18 - feedDecimals));
        } else if (feedDecimals > 18) {
            price = price / (10 ** (feedDecimals - 18));
        }
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Set price feed for a token
     * @param token Address of the token
     * @param priceFeed Address of Chainlink price feed
     */
    function setPriceFeed(address token, address priceFeed) external onlyOwner {
        require(token != address(0), "Invalid token");
        priceFeeds[token] = priceFeed;
        emit PriceFeedUpdated(token, priceFeed);
    }
    
    /**
     * @notice Set fallback price for a token
     * @param token Address of the token
     * @param price Fallback price (18 decimals)
     */
    function setFallbackPrice(address token, uint256 price) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(price > 0, "Invalid price");
        fallbackPrices[token] = price;
        emit FallbackPriceUpdated(token, price);
    }
    
    /**
     * @notice Batch set price feeds
     * @param tokens Array of token addresses
     * @param feeds Array of price feed addresses
     */
    function batchSetPriceFeeds(
        address[] calldata tokens,
        address[] calldata feeds
    ) external onlyOwner {
        require(tokens.length == feeds.length, "Length mismatch");
        
        for (uint256 i = 0; i < tokens.length; i++) {
            priceFeeds[tokens[i]] = feeds[i];
            emit PriceFeedUpdated(tokens[i], feeds[i]);
        }
    }
}
