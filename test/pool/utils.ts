import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

export const deployChildPool = async (
    deployer: SignerWithAddress,
    childTunnelAddress: string,
    maticTokenAddress: string,
    stMaticTokenAddress: string,
    shuttleExpiry: number,
    ownerAddress: string
) => {

    const ChildPool = await ethers.getContractFactory(
        "ChildPool"
    );
    const childPool = await ChildPool.connect(deployer).deploy();
    await childPool.deployed();

    const initPool = await childPool.connect(deployer).init(
        childTunnelAddress,
        maticTokenAddress,
        stMaticTokenAddress,
        shuttleExpiry,
        ownerAddress
    );
    await initPool.wait();

    return childPool;
}