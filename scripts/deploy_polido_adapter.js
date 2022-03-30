const { ethers, upgrades, hre } = require("hardhat");

async function main() {
  const PoLidoAdapter = await ethers.getContractFactory("PoLidoAdapter");
  const polidoAdapterProxy = await upgrades.deployProxy(PoLidoAdapter, [50]);
  await polidoAdapterProxy.deployed();
  console.log("Polido Adapter Proxy deployed to:", polidoAdapterProxy.address);
}

main()
  .then(() => {
    console.log("Done");
  })
  .catch((error) => {
    console.error(error);
  });
