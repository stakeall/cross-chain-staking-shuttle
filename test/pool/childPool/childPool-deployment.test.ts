import { expect } from "chai";
import { ethers } from "hardhat";
import { ShuttleStatus } from "../utils";

describe("ChildPool.init", function () {

    it('validate ChildPool Deployment', async () => {

        const ChildPool = await ethers.getContractFactory(
            "ChildPool"
        );

        const [deployer, owner, childTunnel, maticToken, stMaticToken, feeBeneficiary, fundCollector] = await ethers.getSigners();

        const childPool = await ChildPool.connect(deployer).deploy();
        await childPool.deployed();

        const shuttleExpiry = 2000;
        const fee = 500;
        const initPool = await childPool.connect(deployer).initialize(
            childTunnel.address,
            maticToken.address,
            stMaticToken.address,
            fundCollector.address,
            shuttleExpiry,
            fee,
            feeBeneficiary.address,
            owner.address
        );

        // // wait until the transaction is mined
        const receipt = await initPool.wait();

        const deploymentBlock = receipt.blockNumber;

        // assert storage
        expect(await childPool.childTunnel()).to.equal(childTunnel.address);
        expect(await childPool.maticToken()).to.equal(maticToken.address);
        expect(await childPool.stMaticToken()).to.equal(stMaticToken.address);
        expect(await childPool.fundCollector()).to.equal(fundCollector.address);
        expect(await childPool.shuttleExpiry()).to.equal(shuttleExpiry);
        expect(await childPool.fee()).to.equal(fee);
        expect(await childPool.feeBeneficiary()).to.equal(feeBeneficiary.address);
        expect(await childPool.currentShuttle()).to.equal(1);
        expect(await childPool.availableMaticBalance()).to.equal(0);
        expect(await childPool.availableStMaticBalance()).to.equal(0);

        const currentShuttleObject = await childPool.shuttles(1);

        // assert shuttle
        expect(currentShuttleObject.status).to.equals(ShuttleStatus.AVAILABLE);
        expect(currentShuttleObject.totalAmount).to.equals(0);
        expect(currentShuttleObject.recievedToken).to.equals(0);
        expect(currentShuttleObject.expiry).to.equals(deploymentBlock + shuttleExpiry);

        
        // validate roles owner has all the roles
        expect(await childPool.hasRole(await childPool.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
        expect(await childPool.hasRole(await childPool.OPERATOR_ROLE(), owner.address)).to.equal(true);
        expect(await childPool.hasRole(await childPool.CANCEL_ROLE(), owner.address)).to.equal(true);
        expect(await childPool.hasRole(await childPool.PAUSE_ROLE(), owner.address)).to.equal(true);
        expect(await childPool.hasRole(await childPool.GOVERNANCE_ROLE(), owner.address)).to.equal(true);

        // validate deployer has no roles
        expect(await childPool.hasRole(await childPool.DEFAULT_ADMIN_ROLE(), deployer.address)).to.equal(false);
        expect(await childPool.hasRole(await childPool.OPERATOR_ROLE(), deployer.address)).to.equal(false);
        expect(await childPool.hasRole(await childPool.CANCEL_ROLE(), deployer.address)).to.equal(false);
        expect(await childPool.hasRole(await childPool.PAUSE_ROLE(), deployer.address)).to.equal(false);
        expect(await childPool.hasRole(await childPool.GOVERNANCE_ROLE(), deployer.address)).to.equal(false);

    });

});