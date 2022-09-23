import { expect } from "chai";
import { ethers } from "hardhat";
import { advanceBlocks } from "../../testHelpers";
import { deployChildPool } from "../utils";

describe("ChildPool.expireShuttle", function () {

    it('validate expireShuttle if current block number is greater than expiry block ', async () => {

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
        await childPool.connect(user1).deposit({
            value: amount
        });

        await advanceBlocks(10);

        await expect(childPool.connect(user1).expireShuttle(1)).to.emit(childPool, 'ShuttleExpired').withArgs(1);
    });

    it('validate expireShuttle if current block number is equal to expiry block ', async () => {

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
        await childPool.connect(user1).deposit({
            value: amount
        });

        await advanceBlocks(expiryBlock);

        await expect(childPool.connect(user1).expireShuttle(1)).to.emit(childPool, 'ShuttleExpired').withArgs(1);
    });

    it('should revert if expiry block is less than current block ', async () => {

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
        await childPool.connect(user1).deposit({
            value: amount
        });

        await advanceBlocks(2);

        await expect(childPool.connect(user1).expireShuttle(1)).to.be.revertedWith("NotReadyToExpire");
    });

    it('should revert if shuttle status is not AVAILABLE ', async () => {

        const [deployer, owner, user1,  feeBeneficiary] = await ethers.getSigners();

        // deploy child pool
        const expiryBlock = 5;
        const { childPool } = await deployChildPool(
            deployer,
            expiryBlock,
            owner.address,
            feeBeneficiary.address
        );


        const wrongShuttleId = 10;
        await expect(childPool.connect(user1).expireShuttle(wrongShuttleId)).to.be.revertedWith("NotCurrentShuttle");
    });

    it('should allow deposit of funds to next shuttle if current shuttle is expired ', async() => {

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
        await childPool.connect(user1).deposit({
            value: amount
        });

        await advanceBlocks(10);

        await expect(childPool.connect(user1).expireShuttle(1)).to.emit(childPool, 'ShuttleExpired').withArgs(1);


        await expect(childPool.connect(user1).deposit({
            value: amount
        })).to.emit(childPool, 'Deposit').withArgs(2, user1.address, amount);;
    })

});