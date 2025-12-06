const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying DedlyFi Loan Protocol V2 to Sepolia...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

    // ============ Configuration ============
    
    const FEE_COLLECTOR = deployer.address; // Change to treasury address in production
    const USDC_SEPOLIA = "0xaDD1Fbe72192A8328AeD0EA6E1f729fde11Fd8Ad"; // Sepolia USDC
    const WETH_SEPOLIA = "0x918530d86c239f92E58A98CE8ed446DC042613DB";
    const WBTC_SEPOLIA = "0xA32ecf29Ed19102A639cd1a9706079d055f3CF2B";
    
    // Interest rate: 5% APY = ~1.9e12 per block
    // Formula: (1 + APY)^(1/blocksPerYear) - 1
    // 5% APY with 2,628,000 blocks/year = 1.9025875e12
    const BASE_RATE_PER_BLOCK = "1902587500000"; // 5% APY
    
    console.log("Configuration:");
    console.log("- Fee Collector:", FEE_COLLECTOR);
    console.log("- USDC:", USDC_SEPOLIA);
    console.log("- Base Rate:", BASE_RATE_PER_BLOCK, "(~5% APY)\n");

    // ============ Deploy Price Oracle ============
    
    console.log("📊 Deploying PriceOracle...");
    const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
    const priceOracle = await PriceOracle.deploy();
    await priceOracle.waitForDeployment();
    const priceOracleAddress = await priceOracle.getAddress();
    console.log("✅ PriceOracle deployed to:", priceOracleAddress, "\n");

    // ============ Deploy LoanBrokerV2 ============
    
    console.log("🏦 Deploying LoanBrokerV2...");
    const LoanBrokerV2 = await hre.ethers.getContractFactory("LoanBrokerV2");
    const loanBroker = await LoanBrokerV2.deploy(
        FEE_COLLECTOR,
        priceOracleAddress,
        USDC_SEPOLIA,
        BASE_RATE_PER_BLOCK
    );
    await loanBroker.waitForDeployment();
    const loanBrokerAddress = await loanBroker.getAddress();
    console.log("✅ LoanBrokerV2 deployed to:", loanBrokerAddress, "\n");

    // ============ Configure Supported Collateral ============
    
    console.log("⚙️ Configuring supported collateral...");
    
    const addWETH = await loanBroker.addSupportedCollateral(WETH_SEPOLIA);
    await addWETH.wait();
    console.log("✅ WETH added as supported collateral");
    
    const addWBTC = await loanBroker.addSupportedCollateral(WBTC_SEPOLIA);
    await addWBTC.wait();
    console.log("✅ WBTC added as supported collateral\n");

    // ============ Verify Configuration ============
    
    console.log("🔍 Verifying deployment...");
    const config = await loanBroker.config();
    console.log("Protocol Configuration:");
    console.log("- Platform Fee:", config.platformFeeBps.toString(), "bps (1%)");
    console.log("- Liquidation Threshold:", config.liquidationThreshold.toString(), "bps (80%)");
    console.log("- Liquidation Bonus:", config.liquidationBonusBps.toString(), "bps (5%)");
    console.log("- Max LTV:", config.maxLTV.toString(), "bps (70%)");
    console.log("- Fee Collector:", config.feeCollector);
    console.log("- Price Oracle:", config.priceOracle);
    console.log("- USDC Token:", config.usdcToken, "\n");

    // ============ Summary ============
    
    console.log("=" .repeat(60));
    console.log("🎉 Deployment Complete!\n");
    console.log("📝 Contract Addresses:");
    console.log("=" .repeat(60));
    console.log("PriceOracle:    ", priceOracleAddress);
    console.log("LoanBrokerV2:   ", loanBrokerAddress);
    console.log("=" .repeat(60));
    console.log("\n📋 Next Steps:");
    console.log("1. Update frontend .env with new contract addresses");
    console.log("2. Update backend .env with new contract addresses");
    console.log("3. Verify contracts on Etherscan:");
    console.log(`   npx hardhat verify --network sepolia ${priceOracleAddress}`);
    console.log(`   npx hardhat verify --network sepolia ${loanBrokerAddress} "${FEE_COLLECTOR}" "${priceOracleAddress}" "${USDC_SEPOLIA}" "${BASE_RATE_PER_BLOCK}"`);
    console.log("4. Fund LoanBroker with USDC for lending");
    console.log("5. Start liquidation bot\n");

    // ============ Save Deployment Info ============
    
    const fs = require('fs');
    const deploymentInfo = {
        network: "sepolia",
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            PriceOracle: priceOracleAddress,
            LoanBrokerV2: loanBrokerAddress
        },
        configuration: {
            feeCollector: FEE_COLLECTOR,
            usdcToken: USDC_SEPOLIA,
            wethToken: WETH_SEPOLIA,
            wbtcToken: WBTC_SEPOLIA,
            baseRatePerBlock: BASE_RATE_PER_BLOCK,
            platformFeeBps: config.platformFeeBps.toString(),
            liquidationThreshold: config.liquidationThreshold.toString(),
            liquidationBonusBps: config.liquidationBonusBps.toString(),
            maxLTV: config.maxLTV.toString()
        }
    };

    fs.writeFileSync(
        './deployment-sepolia.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("💾 Deployment info saved to deployment-sepolia.json\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
