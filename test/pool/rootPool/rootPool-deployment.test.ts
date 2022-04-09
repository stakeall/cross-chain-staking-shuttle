import { expect } from "chai";
import { ethers } from "hardhat";

describe("RootPool.init", function () {

    it('validate RootPool Deployment', async () => {

        const RootPool = await ethers.getContractFactory(
            "RootPool"
        );

        const [deployer, owner, rootTunnel, withdrawManagerProxy, erc20PredicateBurnOnly, depositManagerProxy, erc20PredicateProxy, polidoAdapter, maticToken, childPoolFundCollector] = await ethers.getSigners();

        const rootPool = await RootPool.connect(deployer).deploy();
        await rootPool.deployed();

        const initPool = await rootPool.connect(deployer).initialize(
            rootTunnel.address,
            withdrawManagerProxy.address,
            erc20PredicateBurnOnly.address,
            depositManagerProxy.address,
            erc20PredicateProxy.address,
            polidoAdapter.address,
            maticToken.address,
            childPoolFundCollector.address,
            owner.address
        );

        // wait until the transaction is mined
        await initPool.wait();

        // assert storage
        expect(await rootPool.rootTunnel()).to.equal(rootTunnel.address);
        expect(await rootPool.withdrawManagerProxy()).to.equal(withdrawManagerProxy.address);
        expect(await rootPool.erc20PredicateBurnOnly()).to.equal(erc20PredicateBurnOnly.address);
        expect(await rootPool.depositManagerProxy()).to.equal(depositManagerProxy.address);
        expect(await rootPool.erc20PredicateProxy()).to.equal(erc20PredicateProxy.address);
        expect(await rootPool.polidoAdapter()).to.equal(polidoAdapter.address);
        expect(await rootPool.maticToken()).to.equal(maticToken.address);
        expect(await rootPool.childPoolFundCollector()).to.equal(childPoolFundCollector.address);
        
        // validate roles owner has all the roles
        expect(await rootPool.hasRole(await rootPool.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
        expect(await rootPool.hasRole(await rootPool.OPERATOR_ROLE(), owner.address)).to.equal(true);
        expect(await rootPool.hasRole(await rootPool.CANCEL_ROLE(), owner.address)).to.equal(true);
        expect(await rootPool.hasRole(await rootPool.PAUSE_ROLE(), owner.address)).to.equal(true);
        expect(await rootPool.hasRole(await rootPool.GOVERNANCE_ROLE(), owner.address)).to.equal(true);

        // validate deployer has no roles
        expect(await rootPool.hasRole(await rootPool.DEFAULT_ADMIN_ROLE(), deployer.address)).to.equal(false);
        expect(await rootPool.hasRole(await rootPool.OPERATOR_ROLE(), deployer.address)).to.equal(false);
        expect(await rootPool.hasRole(await rootPool.CANCEL_ROLE(), deployer.address)).to.equal(false);
        expect(await rootPool.hasRole(await rootPool.PAUSE_ROLE(), deployer.address)).to.equal(false);
        expect(await rootPool.hasRole(await rootPool.GOVERNANCE_ROLE(), deployer.address)).to.equal(false);

    });

});