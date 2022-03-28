const { ethers } = require("hardhat");
const axios = require("axios");
const { parseUnits } = require("ethers/lib/utils");
const { BigNumber } = require("ethers");

const getBigNumberByDecimal = (decimal) => BigNumber.from(10).pow(decimal);

async function main() {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0x0548F59fEE79f8832C299e01dCA5c76F034F558e"],
  });

  const signer = await ethers.getSigner(
    "0x0548F59fEE79f8832C299e01dCA5c76F034F558e"
  );

  const usdtAddr = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  const maticAddress = "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0";
  const amount = parseUnits("300", "6");
  console.log("amount ", amount);

  const referrerAddress = "0x7c30D7AE01e8459d05DF8b410f61F0922b86e183";

  const polidoAdapterContract = await ethers.getContractFactory(
    "PoLidoAdapter"
  );

  const stMaticInstance = await ethers.getContractAt(
    "IERC20",
    "0x9ee91F9f426fA633d227f7a9b000E28b9dfd8599"
  );

  const usdtInstance = await ethers.getContractAt("IERC20", usdtAddr);

  const fee = 0.5;
  const slippage = 1;
  console.log(
    "before usdt balance ",
    await usdtInstance.balanceOf(referrerAddress)
  );
  const polidoAdapterInstance = await polidoAdapterContract
    .connect(signer)
    .deploy();
  const request = `https://api.1inch.exchange/v4.0/1/swap?fromTokenAddress=${usdtAddr}&toTokenAddress=${maticAddress}&amount=${amount}&slippage=${slippage}&fromAddress=${polidoAdapterInstance.address}&disableEstimate=true&referrerAddress=${referrerAddress}&fee=${fee}`;
  console.log(request);
  const swapResponse = await axios.get(request);
  await polidoAdapterInstance.connect(signer).initialize(50);
  console.log("estimatedSwapAmount ", swapResponse.data.toTokenAmount);
  const estimatedSwapAmount = BigNumber.from(swapResponse.data.toTokenAmount);
  console.log("estimatedSwapAmount ", estimatedSwapAmount);
  const toTokenDecimal = 18;
  const fromTokenDecimal = 6;
  const precision = 6;
  const normalizeSlippage = (100 - slippage) / 100;
  const reducedAmount = amount.mul(BigNumber.from(995)).div(1000);
  const reducedEstimatedSwapAmount = estimatedSwapAmount
    .mul(BigNumber.from(995))
    .div(1000);
  let unitAmt = reducedEstimatedSwapAmount
    .mul(BigNumber.from((normalizeSlippage * 10 ** precision).toFixed(0)))
    .div(reducedAmount); // adding precision factor
  unitAmt = unitAmt
    .mul(getBigNumberByDecimal(18))
    .div(getBigNumberByDecimal(toTokenDecimal)); // normalizing to 18 decimal
  unitAmt = parseUnits(unitAmt.toString(), fromTokenDecimal - precision); // removing precision factor

  console.log("unitAmt ", unitAmt);

  console.log(
    "Before Referrer balance ",
    await ethers.provider.getBalance(referrerAddress)
  );

  await usdtInstance
    .connect(signer)
    .approve(polidoAdapterInstance.address, amount);
  await polidoAdapterInstance
    .connect(signer)
    .swapAndStake(usdtAddr, amount, unitAmt, swapResponse.data.tx.data);

  console.log(
    "User stMatic balance ",
    await stMaticInstance.balanceOf(signer.address)
  );
  console.log(
    "after referrer usdt balance ",
    await usdtInstance.balanceOf(referrerAddress)
  );
}

main()
  .then(() => {
    console.log("done");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
