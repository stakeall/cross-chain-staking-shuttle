import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

export const deployChildPool = async (
    deployer: SignerWithAddress,
    stMaticTokenAddress: string,
    shuttleExpiry: number,
    ownerAddress: string
) => {

    const mockMaticToken = await deployMockMaticToken(deployer);
    const mockFxStateChildTunnel = await deployMockFxStateChildTunnel(deployer);

    const ChildPool = await ethers.getContractFactory(
        "ChildPool"
    );
    const childPool = await ChildPool.connect(deployer).deploy();
    await childPool.deployed();

    const initPool = await childPool.connect(deployer).init(
        mockFxStateChildTunnel.address,
        mockMaticToken.address,
        stMaticTokenAddress,
        shuttleExpiry,
        ownerAddress
    );
    await initPool.wait();


    return { childPool, mockMaticToken, mockFxStateChildTunnel };
}


export const deployMockMaticToken = async (
    deployer: SignerWithAddress,
) => {
    const MockMaticToken = await ethers.getContractFactory(
        "MockMaticToken"
    );

    const mockMaticToken = await MockMaticToken.connect(deployer).deploy();
    return mockMaticToken;
}

export const deployMockFxStateChildTunnel = async (
    deployer: SignerWithAddress,
) => {
    const MockFxStateChildTunnel = await ethers.getContractFactory(
        "MockFxStateChildTunnel"
    );

    const mockFxStateChildTunnel = await MockFxStateChildTunnel.connect(deployer).deploy();
    return mockFxStateChildTunnel;
}