const { ethers } = require("hardhat");
const hre = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");
const addresses = require("./address.js");

console.log("hre.network.name ", hre.network.name);

console.log({ addresses });
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const deployRoot = false;
  //hre.network.name === "goerli" || hre.network.name === "mainnet";

async function main() {
  const verificationEnabled = true;
  const [deployer] = await ethers.getSigners();
  const deployerAddress = deployer.address;
  console.log(`\n\n\n Deployer Address: ${deployerAddress} \n\n\n`);
  const balanceBefore = await hre.web3.eth.getBalance(deployerAddress);
  console.log("before balance of deployer ", balanceBefore.toString());

  const chainId = await hre.web3.eth.getChainId();
  console.log({ chainId });
  console.log({ add: addresses[chainId] });
  const checkPointManager = addresses[chainId].checkPointManager;
  const fxRoot = addresses[chainId].fxRoot;
  const fxChild = addresses[chainId].fxChild;

  // Deploy FxStateRootTunnel
  let fxStateRootTunnel;
  if (deployRoot) {
    const FxStateRootTunnel = await ethers.getContractFactory(
      "FxStateRootTunnel"
    );

    fxStateRootTunnel = await FxStateRootTunnel.deploy(
      checkPointManager,
      fxRoot
    );
    console.log(
      "fxStateRootTunnel tx hash : ",
      fxStateRootTunnel.deployTransaction.hash
    );
    await fxStateRootTunnel.deployed();

    console.log("fxStateRootTunnel deployed: ", fxStateRootTunnel.address);
  }

  // Deploy FxStateChildTunnel
  let fxStateChildTunnel;
  if (!deployRoot) {
    const FxStateChildTunnel = await ethers.getContractFactory(
      "FxStateChildTunnel"
    );

    fxStateChildTunnel = await FxStateChildTunnel.deploy(fxChild);
    console.log(
      "fxStateChildTunnel tx hash : ",
      fxStateChildTunnel.deployTransaction.hash
    );

    await fxStateChildTunnel.deployed();

    console.log("fxStateChildTunnel deployed: ", fxStateChildTunnel.address);
  }

  const balanceAfter = await hre.web3.eth.getBalance(deployerAddress);
  console.log("after balance of deployer ", balanceAfter.toString());
  console.log(
    "Total deployment cost  ",
    ethers.utils.formatUnits(
      BigNumber.from(balanceBefore).sub(BigNumber.from(balanceAfter))
    )
  );

  console.log("waiting for a minute");

  if (verificationEnabled) {
    await sleep(60000);

    if (deployRoot) {
      await hre.run("verify:verify", {
        address: fxStateRootTunnel.address,
        constructorArguments: [checkPointManager, fxRoot],
      });
    }

    if (!deployRoot) {
      await hre.run("verify:verify", {
        address: fxStateChildTunnel.address,
        constructorArguments: [fxChild],
      });
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
