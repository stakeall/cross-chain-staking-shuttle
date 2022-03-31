import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { deployChildPool, } from "../utils";

describe("ChildPool.setFee", function () {

    it('should setFee', async() => {

        const [deployer, owner, user1,feeBeneficiary] = await ethers.getSigners();

        const { childPool } = await deployChildPool(
            deployer,
            2000,
            owner.address,
            feeBeneficiary.address
        );

        const beforeFee = await  childPool.fee();
        await childPool.connect(owner).setFee(1000);
        const afterFee = await childPool.fee();

        expect(beforeFee).to.equals(500);
        expect(afterFee).to.equals(1000);
    });

});