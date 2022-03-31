import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { getShuttleInEnrouteState, ShuttleProcessingStatus, ShuttleStatus } from "../utils";

describe("ChildPool.arriveShuttle", function () {

    it('validate arrive shuttle in case of processed shuttle', async () => {

        const [deployer, owner, user1, user2] = await ethers.getSigners();

        // deploy child pool
        const { childPool, mockFxStateChildTunnel, stMaticToken } = await getShuttleInEnrouteState(deployer, 2000, owner, user1, user2);

        const shuttleArrivalData = {
            stMaticAmount: ethers.utils.parseEther("3"),
            shuttleProcessingStatus: ShuttleProcessingStatus.PROCESSED,
            shuttleNumber: 1
        }

        const encodedMessageData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "uint256", "uint8"],
            [shuttleArrivalData.shuttleNumber, shuttleArrivalData.stMaticAmount, shuttleArrivalData.shuttleProcessingStatus]
        );

        // mock message arrival 
        await mockFxStateChildTunnel.setLatestData(encodedMessageData);
        // mock token arrival 
        await stMaticToken.mint(childPool.address, shuttleArrivalData.stMaticAmount);

        const fee =
            BigNumber.from(500).mul(BigNumber.from(shuttleArrivalData.stMaticAmount)).div(BigNumber.from(10000));
        await expect(childPool.connect(owner).arriveShuttle(1)).to.emit(childPool, 'ShuttleArrived').withArgs(1, shuttleArrivalData.stMaticAmount, ShuttleStatus.ARRIVED, fee);


        const shuttleObject = await childPool.shuttles(1);
        expect(shuttleObject.status).to.equals(ShuttleStatus.ARRIVED);
        
        expect(shuttleObject.recievedToken).to.equals(BigNumber.from(shuttleArrivalData.stMaticAmount).sub(BigNumber.from(fee)));
        const feeBeneficiaryStMaticBalance = await stMaticToken.balanceOf(deployer.address);

        expect(feeBeneficiaryStMaticBalance).to.equals(feeBeneficiaryStMaticBalance);
    });

    it('validate arrive shuttle in case of cancelled shuttle', async () => {

        const [deployer, owner, user1, user2] = await ethers.getSigners();

        // deploy child pool
        const { childPool, mockFxStateChildTunnel } = await getShuttleInEnrouteState(deployer, 2000, owner, user1, user2);

        const shuttleArrivalData = {
            stMaticAmount: ethers.utils.parseEther("3"),
            shuttleProcessingStatus: ShuttleProcessingStatus.CANCELLED,
            shuttleNumber: 1
        }

        const encodedMessageData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "uint256", "uint8"],
            [shuttleArrivalData.shuttleNumber, shuttleArrivalData.stMaticAmount, shuttleArrivalData.shuttleProcessingStatus]
        );

        // mock message arrival 
        await mockFxStateChildTunnel.setLatestData(encodedMessageData);
        // mock token arrival 
        await deployer.sendTransaction({
            to: childPool.address,
            value: shuttleArrivalData.stMaticAmount,
            from: deployer.address
        })

        let shuttleObject = await childPool.shuttles(1);

        await expect(childPool.connect(owner).arriveShuttle(1)).to.emit(childPool, 'ShuttleArrived').withArgs(1, shuttleObject.totalAmount, ShuttleStatus.CANCELLED, 0);


        shuttleObject = await childPool.shuttles(1);
        expect(shuttleObject.status).to.equals(ShuttleStatus.CANCELLED);
        expect(shuttleObject.recievedToken).to.equals(0);
    });

    it('should fail on arrive shuttle if tokens are not arrived from bridge in case of success process', async () => {


        const [deployer, owner, user1, user2] = await ethers.getSigners();

        // deploy child pool
        const { childPool, mockFxStateChildTunnel, stMaticToken } = await getShuttleInEnrouteState(deployer, 2000, owner, user1, user2);

        const shuttleArrivalData = {
            stMaticAmount: ethers.utils.parseEther("3"),
            shuttleProcessingStatus: ShuttleProcessingStatus.PROCESSED,
            shuttleNumber: 1
        }

        const encodedMessageData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "uint256", "uint8"],
            [shuttleArrivalData.shuttleNumber, shuttleArrivalData.stMaticAmount, shuttleArrivalData.shuttleProcessingStatus]
        );

        // mock message arrival 
        await mockFxStateChildTunnel.setLatestData(encodedMessageData);

        await expect(childPool.connect(owner).arriveShuttle(1)).to.be.revertedWith("!insufficient stMatic balance");

    });

    it('should fail on arrive shuttle if tokens are not arrived from bridge in case of cancelled process', async () => {

        const [deployer, owner, user1, user2] = await ethers.getSigners();

        // deploy child pool


        const { childPool, mockFxStateChildTunnel } = await getShuttleInEnrouteState(deployer, 2000, owner, user1, user2);

        const shuttleArrivalData = {
            stMaticAmount: ethers.utils.parseEther("3"),
            shuttleProcessingStatus: ShuttleProcessingStatus.CANCELLED,
            shuttleNumber: 1
        }

        const encodedMessageData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "uint256", "uint8"],
            [shuttleArrivalData.shuttleNumber, shuttleArrivalData.stMaticAmount, shuttleArrivalData.shuttleProcessingStatus]
        );

        // mock message arrival 
        await mockFxStateChildTunnel.setLatestData(encodedMessageData);

        await expect(childPool.connect(owner).arriveShuttle(1)).to.be.revertedWith("!insufficient Matic balance");
    });

    it('should fail to arrive shuttle in case of message is not recieved from tunnels', async () => {

        const [deployer, owner, user1, user2] = await ethers.getSigners();

        // deploy child pool
        const { childPool, mockFxStateChildTunnel, stMaticToken } = await getShuttleInEnrouteState(deployer, 2000, owner, user1, user2);

        const shuttleArrivalData = {
            stMaticAmount: ethers.utils.parseEther("3"),
            shuttleProcessingStatus: ShuttleProcessingStatus.PROCESSED,
            shuttleNumber: 1
        }

        const randomShuttleNumber = 10;
        const encodedMessageData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "uint256", "uint8"],
            [randomShuttleNumber, shuttleArrivalData.stMaticAmount, shuttleArrivalData.shuttleProcessingStatus]
        );

        // mock message arrival 
        await mockFxStateChildTunnel.setLatestData(encodedMessageData);

        // mock token arrival 
        await stMaticToken.mint(childPool.address, shuttleArrivalData.stMaticAmount);

        await expect(childPool.connect(owner).arriveShuttle(1)).to.be.revertedWith("!shuttle message not recieved");
    });

    it('should fail if shuttle already arrived', async () => {

        const [deployer, owner, user1, user2] = await ethers.getSigners();

        // deploy child pool
        const { childPool, mockFxStateChildTunnel, stMaticToken } = await getShuttleInEnrouteState(deployer, 2000, owner, user1, user2);

        const shuttleArrivalData = {
            stMaticAmount: ethers.utils.parseEther("3"),
            shuttleProcessingStatus: ShuttleProcessingStatus.PROCESSED,
            shuttleNumber: 1
        }

        const encodedMessageData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "uint256", "uint8"],
            [shuttleArrivalData.shuttleNumber, shuttleArrivalData.stMaticAmount, shuttleArrivalData.shuttleProcessingStatus]
        );

        // mock message arrival 
        await mockFxStateChildTunnel.setLatestData(encodedMessageData);
        // mock token arrival 
        await stMaticToken.mint(childPool.address, shuttleArrivalData.stMaticAmount);

        await childPool.connect(owner).arriveShuttle(1);

        await expect(childPool.connect(owner).arriveShuttle(1)).to.emit(childPool, 'ShuttleArrived').to.be.revertedWith("!Shuttle should be enrouted");
    });

    it('should fail for non operator role', async () => {

        const [deployer, owner, user1, user2] = await ethers.getSigners();

        // deploy child pool
        const { childPool, mockFxStateChildTunnel, stMaticToken } = await getShuttleInEnrouteState(deployer, 2000, owner, user1, user2);

        const shuttleArrivalData = {
            stMaticAmount: ethers.utils.parseEther("3"),
            shuttleProcessingStatus: ShuttleProcessingStatus.PROCESSED,
            shuttleNumber: 1
        }

        const encodedMessageData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "uint256", "uint8"],
            [shuttleArrivalData.shuttleNumber, shuttleArrivalData.stMaticAmount, shuttleArrivalData.shuttleProcessingStatus]
        );

        // mock message arrival 
        await mockFxStateChildTunnel.setLatestData(encodedMessageData);
        // mock token arrival 
        await stMaticToken.mint(childPool.address, shuttleArrivalData.stMaticAmount);

        await childPool.connect(owner).arriveShuttle(1);

        await expect(childPool.connect(user1).arriveShuttle(1)).to.emit(childPool, 'ShuttleArrived').to.be.revertedWith(`AccessControl: account ${user1.address.toLowerCase()} is missing role 0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929`);
    });

    it('should not let enroute other shuttle if current shuttle is not arrived', async () => {

        const [deployer, owner, user1, user2] = await ethers.getSigners();

        // deploy child pool
        const { childPool } = await getShuttleInEnrouteState(deployer, 2000, owner, user1, user2);

        const amount = ethers.utils.parseEther("1");
        await expect(childPool.connect(user1).deposit(amount, {
            value: amount
        }))
            .to.emit(childPool, 'Deposit').withArgs(2, user1.address, amount);

        await expect(childPool.connect(owner).enrouteShuttle(2))
            .to.be.revertedWith('!already enrouted shuttle');
    })

    it('should let enroute other shuttle if current shuttle is not arrived', async () => {


        const [deployer, owner, user1, user2] = await ethers.getSigners();

        // deploy child pool
        const { childPool, mockFxStateChildTunnel, stMaticToken } = await getShuttleInEnrouteState(deployer, 2000, owner, user1, user2);

        const shuttleArrivalData = {
            stMaticAmount: ethers.utils.parseEther("3"),
            shuttleProcessingStatus: ShuttleProcessingStatus.PROCESSED,
            shuttleNumber: 1
        }

        // deposit to shuttle 2 
        const amount = ethers.utils.parseEther("1");
        await expect(childPool.connect(user1).deposit(amount, {
            value: amount
        }))
            .to.emit(childPool, 'Deposit').withArgs(2, user1.address, amount);



        const encodedMessageData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "uint256", "uint8"],
            [shuttleArrivalData.shuttleNumber, shuttleArrivalData.stMaticAmount, shuttleArrivalData.shuttleProcessingStatus]
        );

        // mock message arrival 
        await mockFxStateChildTunnel.setLatestData(encodedMessageData);
        // mock token arrival 
        await stMaticToken.mint(childPool.address, shuttleArrivalData.stMaticAmount);

        const fee =
            BigNumber.from(500).mul(BigNumber.from(shuttleArrivalData.stMaticAmount)).div(BigNumber.from(10000));
        await expect(childPool.connect(owner).arriveShuttle(1)).to.emit(childPool, 'ShuttleArrived').withArgs(1, shuttleArrivalData.stMaticAmount, ShuttleStatus.ARRIVED, fee);


        await expect(childPool.connect(owner).enrouteShuttle(2))
            .to.emit(childPool, 'ShuttleEnrouted').withArgs(2, amount);
    })

});