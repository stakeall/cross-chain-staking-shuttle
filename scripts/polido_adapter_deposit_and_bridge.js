const { ethers } = require("hardhat");
const { parseEther } = require("ethers/lib/utils");

async function main() {
  const polidoAdapterContract = await ethers.getContractFactory(
    "PoLidoAdapter"
  );

  const maticInstance = await ethers.getContractAt(
    "IERC20",
    "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0"
  );
  const stMaticInstance = await ethers.getContractAt(
    "IERC20",
    "0x9ee91F9f426fA633d227f7a9b000E28b9dfd8599"
  );

  const polidoAdapterInstance = await polidoAdapterContract.deploy();

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0x5d683540B3881b9Ff80c8f31EB929Cabdf59F8e6"],
  });

  const signer = await ethers.getSigner(
    "0x5d683540B3881b9Ff80c8f31EB929Cabdf59F8e6"
  );

  const amount = parseEther("0.1");
  await maticInstance
    .connect(signer)
    .approve(polidoAdapterInstance.address, amount);
  await polidoAdapterInstance
    .connect(signer)
    .depositForAndBridge(signer.address, amount);
  console.log(
    "User stMatic balance ",
    await stMaticInstance.balanceOf(signer.address)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
