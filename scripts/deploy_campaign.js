const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");
const addresses = require("./address");

async function main() {
  const chainId = await hre.web3.eth.getChainId();
  console.log({ chainId });
  console.log({ add: addresses[chainId] });

  const campaignContract = await ethers.getContractFactory("Campaign");
  const campaignProxy = await upgrades.deployProxy(campaignContract, [
    addresses[chainId].childPoolOwner,
    addresses[chainId].childPoolProxy,
  ]);
  await campaignProxy.deployed();
  console.log("Campaign Proxy deployed to:", campaignProxy.address);
}

main()
  .then(() => {
    console.log("Done");
  })
  .catch((error) => {
    console.error(error);
  });
