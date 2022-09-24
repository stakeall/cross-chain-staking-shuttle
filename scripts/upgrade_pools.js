const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");
const addresses = require("./address.js");

console.log("hre.network.name ", hre.network.name);

const deployRoot =
  hre.network.name === "goerli" || hre.network.name === "mainnet";

async function main() {
  const chainId = await hre.web3.eth.getChainId();
  console.log('delpoy root ', deployRoot);

  if (deployRoot) {
    const RootPool = await ethers.getContractFactory("RootPool");

    const proxy = addresses[chainId].rootPoolProxy;

    console.log({ chainId, proxy });
    await upgrades.upgradeProxy(proxy, RootPool);
    console.log('root pool upgrade done');
  } else {
    const ChildPool = await ethers.getContractFactory("ChildPool");

    const proxy = addresses[chainId].childPoolProxy;

    await upgrades.upgradeProxy(proxy, ChildPool);
  }
}

main()
  .then(() => {
    console.log("Done");
  })
  .catch((error) => {
    console.error(error);
  });
