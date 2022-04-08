const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");
const addresses = require("./address.js");

console.log("hre.network.name ", hre.network.name);

const deployRoot =
  hre.network.name === "goerli" || hre.network.name === "mainnet";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = deployer.address;
  console.log(`\n\n\n Deployer Address: ${deployerAddress} \n\n\n`);
  const balanceBefore = await hre.web3.eth.getBalance(deployerAddress);
  console.log("before balance of deployer ", balanceBefore.toString());

  const chainId = await hre.web3.eth.getChainId();
  console.log({ chainId });
  console.log({ add: addresses[chainId] });

  const rootTunnel = addresses[chainId].rootTunnel;
  const withdrawManagerProxy = addresses[chainId].withdrawManagerProxy;
  const erc20PredicateBurnOnly = addresses[chainId].erc20PredicateBurnOnly;
  const depositManagerProxy = addresses[chainId].depositManagerProxy;
  const erc20PredicateProxy = addresses[chainId].erc20PredicateProxy;
  const poLidoAdapter = addresses[chainId].poLidoAdapter;
  const maticToken = addresses[chainId].maticToken;
  const childPoolFundCollector = addresses[chainId].childPoolFundCollector;
  const rootPoolOwner = addresses[chainId].rootPoolOwner;

  // Deploy rootPool
  if (deployRoot) {
    const RootPool = await ethers.getContractFactory("RootPool");

    const rootPool = await upgrades.deployProxy(RootPool, [
      rootTunnel,
      withdrawManagerProxy,
      erc20PredicateBurnOnly,
      depositManagerProxy,
      erc20PredicateProxy,
      poLidoAdapter,
      maticToken,
      childPoolFundCollector,
      rootPoolOwner,
    ]);
    await rootPool.deployed();
    console.log("RootPool Proxy deployed to:", rootPool.address);
  }

  // Deploy childPool
  if (!deployRoot) {
    const childTunnel = addresses[chainId].childTunnel;
    const maticTokenOnChild = addresses[chainId].maticTokenOnChild;
    const stMaticToken = addresses[chainId].stMaticToken;
    const fundCollector = addresses[chainId].fundCollector;
    const fee = addresses[chainId].fee;
    const feeBeneficiary = addresses[chainId].feeBeneficiary;
    const childPoolOwner = addresses[chainId].childPoolOwner;
    const shuttleExpiry = addresses[chainId].shuttleExpiry;

    const ChildPool = await ethers.getContractFactory("ChildPool");

    const childPool = await upgrades.deployProxy(ChildPool, [
      childTunnel,
      maticTokenOnChild,
      stMaticToken,
      fundCollector,
      shuttleExpiry,
      fee,
      feeBeneficiary,
      childPoolOwner,
    ]);
    await childPool.deployed();
    console.log("childPool Proxy deployed to:", childPool.address);
  }

  const balanceAfter = await hre.web3.eth.getBalance(deployerAddress);
  console.log("after balance of deployer ", balanceAfter.toString());
  console.log(
    "Total deployment cost  ",
    ethers.utils.formatUnits(
      BigNumber.from(balanceBefore).sub(BigNumber.from(balanceAfter))
    )
  );
}

main().then(() => {
  console.log("Done");
});
