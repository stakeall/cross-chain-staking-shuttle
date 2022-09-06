const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");
const addresses = require("./address.js");

console.log("hre.network.name ", hre.network.name);

async function main() {
  const chainId = await hre.web3.eth.getChainId();
  console.log("chainId", chainId);
  const Campaign = await ethers.getContractFactory("Campaign");

  const proxy = addresses[chainId].campaign;

  await upgrades.upgradeProxy(proxy, Campaign);
}

main()
  .then(() => {
    console.log("Done");
  })
  .catch((error) => {
    console.error(error);
  });
