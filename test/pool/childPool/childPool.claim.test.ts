import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { advanceBlocks } from "../../testHelpers";
import { deployChildPool, getShuttleInArrivedState, getShuttleInEnrouteState, ShuttleProcessingStatus } from "../utils";

describe("ChildPool.claim", function () {

    it('should let user claim stMatic funds after shuttle in arrived', async() => {

        const [deployer, owner, user1, user2] = await ethers.getSigners();

        // deploy child pool
        const { childPool , stMaticToken } = await getShuttleInArrivedState(
            deployer,
            2000,
            owner,
            user1,
            user2,
            ShuttleProcessingStatus.PROCESSED,
            "2"
        );

        const stMaticAmount = BigNumber.from(ethers.utils.parseEther("2"));

        const shuttle = await childPool.shuttles(1);
        const totalAmount = BigNumber.from(shuttle.totalAmount);
        const recievedAmount = BigNumber.from(shuttle.recievedToken);

        const user1Deposit = BigNumber.from(ethers.utils.parseEther("1"));
        const user2Deposit = BigNumber.from(ethers.utils.parseEther("2"));

        const expectedStMaticAmountUser1 = user1Deposit.mul(recievedAmount).div(totalAmount);
        const expectedStMaticAmountUser2 = user2Deposit.mul(recievedAmount).div(totalAmount);
        
        let availableStMaticBalance = await childPool.availableStMaticBalance();
        expect(availableStMaticBalance).that.equals(ethers.utils.parseEther("2"));

        await expect(childPool.connect(user1).claim(1)).to.emit(childPool, 'TokenClaimed').withArgs(1, stMaticToken.address, user1.address, expectedStMaticAmountUser1);
        availableStMaticBalance = await childPool.availableStMaticBalance();
        expect(availableStMaticBalance).that.equals(stMaticAmount.sub(BigNumber.from(expectedStMaticAmountUser1)));

        await expect(childPool.connect(user2).claim(1)).to.emit(childPool, 'TokenClaimed').withArgs(1, stMaticToken.address, user2.address, expectedStMaticAmountUser2);
        availableStMaticBalance = await childPool.availableStMaticBalance();
        expect(availableStMaticBalance).that.equals(stMaticAmount.sub(BigNumber.from(expectedStMaticAmountUser1).add(BigNumber.from(expectedStMaticAmountUser2))));
    });

    it('should let user claim deposited matic funds after shuttle in cancelled', async() => {

        const [deployer, owner, user1, user2] = await ethers.getSigners();

        // deploy child pool
        const { childPool, mockMaticToken,  stMaticToken } = await getShuttleInArrivedState(
            deployer,
            2000,
            owner,
            user1,
            user2,
            ShuttleProcessingStatus.CANCELLED,
            "3"
        );
        const user1Deposit = BigNumber.from(ethers.utils.parseEther("1"));
        const user2Deposit = BigNumber.from(ethers.utils.parseEther("2"));

        let availableMaticBalance = await childPool.availableMaticBalance();

        expect(availableMaticBalance).that.equals(ethers.utils.parseEther("3"));

        await expect(childPool.connect(user1).claim(1)).to.emit(childPool, 'TokenClaimed').withArgs(1, mockMaticToken.address, user1.address, user1Deposit);
        availableMaticBalance = await childPool.availableMaticBalance();
        expect(availableMaticBalance).that.equals(ethers.utils.parseEther("2"));
        
        await expect(childPool.connect(user2).claim(1)).to.emit(childPool, 'TokenClaimed').withArgs(1, mockMaticToken.address, user2.address, user2Deposit);
        availableMaticBalance = await childPool.availableMaticBalance();
        expect(availableMaticBalance).that.equals(ethers.utils.parseEther("0"));
    });

    it('should fail if shuttle is not in claimable state', async() => {
        const [deployer, owner, user1, user2] = await ethers.getSigners();

        // deploy child pool
        const { childPool, mockFxStateChildTunnel } = await getShuttleInEnrouteState(deployer, 2000, owner, user1, user2);

        await expect(childPool.connect(user1).claim(1)).to.be.revertedWith('!invalid shuttle status');
    });

    it('should fail if user doesnot have deposit in shuttle', async() => {
        const [deployer, owner, user1, user2] = await ethers.getSigners();

        // deploy child pool
        const { childPool } = await getShuttleInArrivedState(
            deployer,
            2000,
            owner,
            user1,
            user2,
            ShuttleProcessingStatus.PROCESSED,
            "2"
        );  

        await expect(childPool.connect(deployer).claim(1)).to.be.revertedWith('!amount');
    });

    it('user should not be able to claim twice', async() => {
        const [deployer, owner, user1, user2] = await ethers.getSigners();

        // deploy child pool
        const { childPool , stMaticToken } = await getShuttleInArrivedState(
            deployer,
            2000,
            owner,
            user1,
            user2,
            ShuttleProcessingStatus.PROCESSED,
            "2"
        ); 


        const shuttle = await childPool.shuttles(1);
        const totalAmount = BigNumber.from(shuttle.totalAmount);
        const recievedAmount = BigNumber.from(shuttle.recievedToken);

        const user1Deposit = BigNumber.from(ethers.utils.parseEther("1"));

        const expectedStMaticAmountUser1 = user1Deposit.mul(recievedAmount).div(totalAmount);

        await expect(childPool.connect(user1).claim(1)).to.emit(childPool, 'TokenClaimed').withArgs(1, stMaticToken.address, user1.address, expectedStMaticAmountUser1);
        await expect(childPool.connect(user1).claim(1)).to.be.revertedWith('!amount');        
    });

    it('should allow users to claim tokens after shuttle is expired', async() => {
        const [deployer, owner, user1,  feeBeneficiary] = await ethers.getSigners();

        // deploy child pool
        const expiryBlock = 5;
        const { childPool, mockMaticToken } = await deployChildPool(
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

        await expect(childPool.connect(user1).expireShuttle(1)).to.emit(childPool, 'ShuttleExpired').withArgs(1);

        expect(childPool.connect(user1).claim(1)).to.emit(childPool, 'TokenClaimed').withArgs(1, mockMaticToken.address, user1.address, amount);

    });

    it('should allow users to claim tokens after shuttle is cancelled', async() => {
        const [deployer, owner, user1,  feeBeneficiary] = await ethers.getSigners();

        // deploy child pool
        const expiryBlock = 5;
        const { childPool, mockMaticToken } = await deployChildPool(
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

        expect(childPool.connect(user1).claim(1)).to.emit(childPool, 'TokenClaimed').withArgs(1, mockMaticToken.address, user1.address, amount);

    });

});