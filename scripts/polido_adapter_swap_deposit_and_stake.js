const { ethers } = require("hardhat");
const axios = require('axios');
const { parseEther } = require("ethers/lib/utils");

async function main() {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0x3EcEf08D0e2DaD803847E052249bb4F8bFf2D5bB"],
  });

  const signer = await ethers.getSigner("0x3EcEf08D0e2DaD803847E052249bb4F8bFf2D5bB");
  
  const ethAddr = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
  const maticAddress = '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0';
  const amount = parseEther("0.2");

  const referrerAddress = "0x7c30D7AE01e8459d05DF8b410f61F0922b86e183";
  
  const polidoAdapterContract = await ethers.getContractFactory('PoLidoAdapter');
  
  const stMaticInstance = await ethers.getContractAt('IERC20', '0x9ee91F9f426fA633d227f7a9b000E28b9dfd8599');
  
  const fee = 0.5;

  const polidoAdapterInstance = await polidoAdapterContract.connect(signer).deploy();
  const request =
    `https://api.1inch.exchange/v4.0/1/swap?fromTokenAddress=${ethAddr}&toTokenAddress=${maticAddress}&amount=${amount}&slippage=${1}&fromAddress=${polidoAdapterInstance.address}&disableEstimate=true&referrerAddress=${referrerAddress}&fee=${fee}`;
  console.log(request);
  const swapResponse = await axios.get(request);
  await polidoAdapterInstance.connect(signer).init(50);
  
  const estimatedSwapAmount = BigNumber.from(swapResponse.data.toTokenAmount);
  console.log('estimatedSwapAmount ', estimatedSwapAmount);
  const toTokenDecimal = 18;
  const fromTokenDecimal = 18;
  const precision = 6;
  const normalizeSlippage = (100 - (slippage)) / 100;
  const reducedAmount = amount.mul(BigNumber.from(995)).div(1000);
  const reducedEstimatedSwapAmount = estimatedSwapAmount.mul(BigNumber.from(995)).div(1000);
  let unitAmt = reducedEstimatedSwapAmount.mul(BigNumber.from((normalizeSlippage * 10 ** precision).toFixed(0))).div(reducedAmount); // adding precision factor
  unitAmt = unitAmt.mul(getBigNumberByDecimal(18)).div(getBigNumberByDecimal(toTokenDecimal)); // normalizing to 18 decimal
  unitAmt = parseUnits(unitAmt.toString(), fromTokenDecimal - precision); // removing precision factor
  
  console.log('Before Referrer balance ', await ethers.provider.getBalance(referrerAddress));
  await polidoAdapterInstance.connect(signer).swapAndStake(
    maticAddress,
    ethAddr,
    amount,
    0,
    swapResponse.data.tx.data,
    {
      value: amount
    }
  );

  console.log('User stMatic balance ', await stMaticInstance.balanceOf(signer.address));
  console.log('After Referrer balance ', await ethers.provider.getBalance(referrerAddress));

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



  /// Connext - polygon
  /// Graph 
  /// Matic
  /// Basic

  /// 