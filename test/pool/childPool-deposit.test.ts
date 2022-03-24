import { expect } from "chai";
import exp from "constants";
import { ethers } from "hardhat";
import { deployChildPool } from "./utils";

describe("ChildPool", function () {

    it('validate ChildPool Deposit', async () => {

        const [deployer, owner, childTunnel, maticToken, stMaticToken, user1] = await ethers.getSigners();

        const childPool = await deployChildPool(
            deployer,
            childTunnel.address,
            maticToken.address,
            stMaticToken.address,
            2000,
            owner.address
        );

        const amount = ethers.utils.parseEther("1");
        await expect(childPool.connect(user1).deposit(amount, {
            value: amount
        }))
            .to.emit(childPool, 'Deposit').withArgs(1, user1.address, amount);


        const currentShuttleObject = await childPool.shuttles(1);

        // assert shuttle
        expect(currentShuttleObject.status).to.equals(0);
        expect(currentShuttleObject.totalAmount).to.equals(amount);
        expect(currentShuttleObject.recievedToken).to.equals(0);

        expect(await childPool.availableMaticBalance()).to.equals(amount);


        // asset user balance in shuttle 
        expect(await childPool.balances(1, user1.address)).to.equals(amount);

    });

    it('should fail for zero amount', async () => {

        const [deployer, owner, childTunnel, maticToken, stMaticToken, user1] = await ethers.getSigners();

        const childPool = await deployChildPool(
            deployer,
            childTunnel.address,
            maticToken.address,
            stMaticToken.address,
            2000,
            owner.address
        );

        const amount = ethers.utils.parseEther("0");
        await expect(childPool.connect(user1).deposit(amount, {
            value: amount
        }))
            .to.be.revertedWith('!amount');

    });

    it('should fail if base token is not passed with deposit transaction', async () => {

        const [deployer, owner, childTunnel, maticToken, stMaticToken, user1] = await ethers.getSigners();

        const childPool = await deployChildPool(
            deployer,
            childTunnel.address,
            maticToken.address,
            stMaticToken.address,
            2000,
            owner.address
        );

        const amount = ethers.utils.parseEther("1");
        await expect(childPool.connect(user1).deposit(amount, {
            value: '0'
        }))
            .to.be.revertedWith('!mismatch amount');

    });

    it('Validate multiple deposits and multi user deposit', async () => {

        const [deployer, owner, childTunnel, maticToken, stMaticToken, user1, user2] = await ethers.getSigners();

        const childPool = await deployChildPool(
            deployer,
            childTunnel.address,
            maticToken.address,
            stMaticToken.address,
            2000,
            owner.address
        );

        // Test for user1
        let amount = ethers.utils.parseEther("1");
        await expect(childPool.connect(user1).deposit(amount, {
            value: amount
        }))
            .to.emit(childPool, 'Deposit').withArgs(1, user1.address, amount);


        // asset user balance in shuttle 
        expect(await childPool.balances(1, user1.address)).to.equals(amount);

        let currentShuttleObject = await childPool.shuttles(1);

        // assert shuttle
        expect(currentShuttleObject.status).to.equals(0);
        expect(currentShuttleObject.totalAmount).to.equals(amount);
        expect(currentShuttleObject.recievedToken).to.equals(0);

        expect(await childPool.availableMaticBalance()).to.equals(amount);


        amount = ethers.utils.parseEther("2");
        await expect(childPool.connect(user1).deposit(amount, {
            value: amount
        }))
            .to.emit(childPool, 'Deposit').withArgs(1, user1.address, amount);

        // asset user balance in shuttle 
        expect(await childPool.balances(1, user1.address)).to.equals(ethers.utils.parseEther("3"));

        currentShuttleObject = await childPool.shuttles(1);

        // assert shuttle
        expect(currentShuttleObject.status).to.equals(0);
        expect(currentShuttleObject.totalAmount).to.equals(ethers.utils.parseEther("3"));
        expect(currentShuttleObject.recievedToken).to.equals(0);

        expect(await childPool.availableMaticBalance()).to.equals(ethers.utils.parseEther("3"));


        // Test for user2 
        amount = ethers.utils.parseEther("5");
        await expect(childPool.connect(user2).deposit(amount, {
            value: amount
        }))
            .to.emit(childPool, 'Deposit').withArgs(1, user2.address, amount);

       // asset user2 balance in shuttle 
        expect(await childPool.balances(1, user2.address)).to.equals(ethers.utils.parseEther("5"));

        currentShuttleObject = await childPool.shuttles(1);

        // assert shuttle
        expect(currentShuttleObject.status).to.equals(0);
        expect(currentShuttleObject.totalAmount).to.equals(ethers.utils.parseEther("8"));
        expect(currentShuttleObject.recievedToken).to.equals(0);

        expect(await childPool.availableMaticBalance()).to.equals(ethers.utils.parseEther("8"));



    });
});