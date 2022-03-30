import { expect } from "chai";
import { ethers } from "hardhat";
import { deployChildPool,  getShuttleInEnrouteState } from "../utils";

describe("ChildPool.enrouteShuttle", function () {

    it('validate enroute shuttle', async () => {

        const [deployer, owner, stMaticToken, user1, user2] = await ethers.getSigners();

        // deploy child pool
        const { childPool, mockMaticToken, mockFxStateChildTunnel } = await deployChildPool(
            deployer,
            2000,
            owner.address
        );

        const prevShuttleObject = await childPool.shuttles(1);

        // deposit user 1
        let amount = ethers.utils.parseEther("1");
        await childPool.connect(user1).deposit(amount, {
            value: amount
        });

        amount = ethers.utils.parseEther("2");

        // deposit user 2
        await childPool.connect(user2).deposit(amount, {
            value: amount
        });

        const totalAmount = ethers.utils.parseEther("3");
        await expect(childPool.connect(owner).enrouteShuttle(1)).to.emit(childPool, 'ShuttleEnrouted').withArgs(1, totalAmount);

        const currentShuttleObject = await childPool.shuttles(1);

        // assert shuttle
        expect(prevShuttleObject.status).to.equals(0);
        expect(currentShuttleObject.status).to.equals(1);
        expect(await childPool.availableMaticBalance()).to.equals(0);

        expect(await mockMaticToken.withdrawAmount()).to.equals(totalAmount);
        expect(await mockFxStateChildTunnel.data()).to.equals(ethers.utils.defaultAbiCoder.encode(["uint256", "uint256"], [1, totalAmount]));
    });

    it('should fail for zero amount', async () => {

        const [deployer, owner, stMaticToken, user1] = await ethers.getSigners();

        const { childPool } = await deployChildPool(
            deployer,
            2000,
            owner.address
        );

        await expect(childPool.connect(owner).enrouteShuttle(1))
            .to.be.revertedWith('!amount');

    });

    it('should fail if shuttle already enrouted', async () => {

        const [deployer, owner, stMaticToken, user1, user2] = await ethers.getSigners();

        // deploy child pool
        const { childPool } = await deployChildPool(
            deployer,
            2000,
            owner.address
        );

        // deposit user 1
        const amount = ethers.utils.parseEther("1");
        await childPool.connect(user1).deposit(amount, {
            value: amount
        });

        await expect(childPool.connect(owner).enrouteShuttle(1)).to.emit(childPool, 'ShuttleEnrouted').withArgs(1, amount);


        await expect(childPool.connect(owner).enrouteShuttle(1))
            .to.be.revertedWith('!already enrouted shuttle');
    });

    it('should fail for non operator role', async () => {

        const [deployer, owner, stMaticToken, user1] = await ethers.getSigners();

        const { childPool } = await deployChildPool(
            deployer,
            2000,
            owner.address
        );

          // deposit user 1
          const amount = ethers.utils.parseEther("1");
          await childPool.connect(user1).deposit(amount, {
              value: amount
          });

        await expect(childPool.connect(user1).enrouteShuttle(1))
            .to.be.revertedWith(`AccessControl: account ${user1.address.toLowerCase()} is missing role 0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929`);
    });

    it('should  let deposit to next shuttle if current shuttle is enrouted', async() => {

        const [deployer, owner, user1, user2] = await ethers.getSigners();

        // deploy child pool
        const { childPool } = await getShuttleInEnrouteState(deployer, 2000, owner, user1, user2);

        const amount = ethers.utils.parseEther("1");
        await expect(childPool.connect(user1).deposit(amount, {
            value: amount
        }))
            .to.emit(childPool, 'Deposit').withArgs(2, user1.address, amount);
    })

});