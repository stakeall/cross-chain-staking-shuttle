import { expect } from "chai";
import { ethers } from "hardhat";

describe("FxStateChildTunnel", function () {
  it("Should set pool address", async function () {
    const FxStateChildTunnel = await ethers.getContractFactory(
      "FxStateChildTunnel"
    );

    const [owner, fxChild, pool] = await ethers.getSigners();

    const fxStateChildTunnel = await FxStateChildTunnel.connect(owner).deploy(fxChild.address);
    await fxStateChildTunnel.deployed();


    const setPoolTx = await fxStateChildTunnel.connect(owner).setPool(pool.address);

    // // wait until the transaction is mined
    await setPoolTx.wait();

    expect(await fxStateChildTunnel.pool()).to.equal(pool.address);
  });

  it("Only pool should send message to root", async function () {
    const FxStateChildTunnel = await ethers.getContractFactory(
      "FxStateChildTunnel"
    );

    const [owner, fxChild, pool] = await ethers.getSigners();

    const fxStateChildTunnel = await FxStateChildTunnel.connect(owner).deploy(fxChild.address);
    await fxStateChildTunnel.deployed();


    const setPoolTx = await fxStateChildTunnel.connect(owner).setPool(pool.address);

    // // wait until the transaction is mined
    await setPoolTx.wait();

    const message = '0xa123';
    await fxStateChildTunnel.connect(pool).sendMessageToRoot(message);

    await expect(fxStateChildTunnel.connect(pool).sendMessageToRoot(message))
      .to.emit(fxStateChildTunnel, 'MessageSent').withArgs(message);

  });

  it("should throw if non pool address send message to root", async function () {
    const FxStateChildTunnel = await ethers.getContractFactory(
      "FxStateChildTunnel"
    );

    const [owner, fxChild, pool] = await ethers.getSigners();

    const fxStateChildTunnel = await FxStateChildTunnel.connect(owner).deploy(fxChild.address);
    await fxStateChildTunnel.deployed();


    const setPoolTx = await fxStateChildTunnel.connect(owner).setPool(pool.address);

    // // wait until the transaction is mined
    await setPoolTx.wait();

    const message = '0xa123';
    await expect(fxStateChildTunnel.connect(owner).sendMessageToRoot(message)).to.be.revertedWith('!pool');
  });
});
