import { expect } from "chai";
import { ethers } from "hardhat";
import { advanceBlocks } from "../../testHelpers";
import { deployChildPool } from "../utils";

describe("ChildPool.cancelShuttle", function () {

    it('validate cancelShuttle ', async () => {

        const [deployer, owner, user1,  feeBeneficiary] = await ethers.getSigners();

        // deploy child pool
        const expiryBlock = 5;
        const { childPool } = await deployChildPool(
            deployer,
            expiryBlock,
            owner.address,
            feeBeneficiary.address
        );

        const amount = ethers.utils.parseEther("1");
        await childPool.connect(user1).deposit(amount, {
            value: amount
        });

        await expect(childPool.connect(owner).cancelShuttle(1)).to.emit(childPool, 'ShuttleCancelled').withArgs(1);
    });

    it('should revert if user with non operator role cancels it ', async () => {

        const [deployer, owner, user1,  feeBeneficiary] = await ethers.getSigners();

        // deploy child pool
        const expiryBlock = 5;
        const { childPool } = await deployChildPool(
            deployer,
            expiryBlock,
            owner.address,
            feeBeneficiary.address
        );

        const amount = ethers.utils.parseEther("1");
        await childPool.connect(user1).deposit(amount, {
            value: amount
        });

        await expect(childPool.connect(user1).cancelShuttle(1)).to.be.revertedWith(`AccessControl: account ${user1.address.toLowerCase()} is missing role 0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929`);
    });

    it('should allow deposit of funds to next shuttle if current shuttle is cancelled ', async() => {

        const [deployer, owner, user1,  feeBeneficiary] = await ethers.getSigners();

        // deploy child pool
        const expiryBlock = 5;
        const { childPool } = await deployChildPool(
            deployer,
            expiryBlock,
            owner.address,
            feeBeneficiary.address
        );

        const amount = ethers.utils.parseEther("1");
        await childPool.connect(user1).deposit(amount, {
            value: amount
        });

        await advanceBlocks(10);

        await expect(childPool.connect(owner).cancelShuttle(1)).to.emit(childPool, 'ShuttleCancelled').withArgs(1);

        await expect(childPool.connect(user1).deposit(amount, {
            value: amount
        })).to.emit(childPool, 'Deposit').withArgs(2, user1.address, amount);;
    })

});