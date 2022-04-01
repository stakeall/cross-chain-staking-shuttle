import { expect } from "chai";
import { ethers } from "hardhat";
import { deployChildPool, } from "../utils";

describe("ChildPool.setShuttleExpiry", function () {

    it('should setShuttleExpiry', async() => {

        const [deployer, owner,feeBeneficiary] = await ethers.getSigners();

        const shuttleExpiry = 2000;
        const { childPool } = await deployChildPool(
            deployer,
            shuttleExpiry,
            owner.address,
            feeBeneficiary.address
        );

        const beforeShuttleExpiry = await  childPool.shuttleExpiry();
        await childPool.connect(owner).setShuttleExpiry(1000);
        const afterShuttleExpiry = await childPool.shuttleExpiry();

        expect(beforeShuttleExpiry).to.equals(2000);
        expect(afterShuttleExpiry).to.equals(1000);
    });

});