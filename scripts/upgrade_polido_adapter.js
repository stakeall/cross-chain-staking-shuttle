const { ethers, upgrades } = require("hardhat");

async function main() {
  const PoLidoAdapter = await ethers.getContractFactory("PoLidoAdapter");

  const proxy = "0x84100E5d1A6A50f1586338fdb1b52c78dC8C65eE";

  await upgrades.upgradeProxy(proxy, PoLidoAdapter);
  console.log("Proxy upgraded");
}

main()
  .then(() => {
    console.log("Done");
  })
  .catch((error) => {
    console.error(error);
  });
