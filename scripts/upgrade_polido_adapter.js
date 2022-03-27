const { ethers, upgrades } = require("hardhat");

async function main() {
  const PoLidoAdapter = await ethers.getContractFactory("PoLidoAdapter");

  const proxy = "0xE6Deb3D6b559ca2AB123e8307c3aa4d7586E29a3";

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
