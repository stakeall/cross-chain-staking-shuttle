const { ethers } = require("hardhat");
const hre = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");

console.log("hre.network.name ", hre.network.name);

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main() {
  const verificationEnabled = true;
  const [deployer] = await ethers.getSigners();
  const deployerAddress = deployer.address;
  console.log(`\n\n\n Deployer Address: ${deployerAddress} \n\n\n`);
  const balanceBefore = await hre.web3.eth.getBalance(deployerAddress);
  console.log("before balance of deployer ", balanceBefore.toString());

  const FundsCollector = await ethers.getContractFactory("FundsCollector");

  const fundsCollector = await FundsCollector.deploy();
  console.log(
    "fundsCollector tx hash : ",
    fundsCollector.deployTransaction.hash
  );

  await fundsCollector.deployed();

  console.log("fundsCollector deployed: ", fundsCollector.address);

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

    await hre.run("verify:verify", {
      address: fundsCollector.address,
      constructorArguments: [],
    });
  }
}

main()
  .then(() => {
    console.log("DONE");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
