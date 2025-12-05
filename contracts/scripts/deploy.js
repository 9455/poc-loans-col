const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const LoanBroker = await hre.ethers.getContractFactory("LoanBroker");
  // Fee collector is the deployer for now
  const broker = await LoanBroker.deploy(deployer.address);

  await broker.waitForDeployment();

  console.log("LoanBroker deployed to:", await broker.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
