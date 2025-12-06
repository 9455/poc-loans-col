const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying FeeTreasury with account:", deployer.address);

  // Deploy FeeTreasury
  const FeeTreasury = await hre.ethers.getContractFactory("FeeTreasury");
  // Pass deployer as default admin
  const treasury = await FeeTreasury.deploy(deployer.address);

  await treasury.waitForDeployment();

  const address = await treasury.getAddress();
  console.log("FeeTreasury deployed to:", address);

  // Verification instruction
  console.log(`Verify with: npx hardhat verify --network sepolia ${address} ${deployer.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
