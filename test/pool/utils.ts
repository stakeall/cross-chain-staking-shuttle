import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

export const deployChildPool = async (
    deployer: SignerWithAddress,
    shuttleExpiry: number,
    ownerAddress: string
) => {

    const mockMaticToken = await deployMockMaticToken(deployer);
    const mockFxStateChildTunnel = await deployMockFxStateChildTunnel(deployer);
    const stMaticToken = await deployMockERC20(deployer);

    const ChildPool = await ethers.getContractFactory(
        "ChildPool"
    );
    const childPool = await ChildPool.connect(deployer).deploy();
    await childPool.deployed();

    const initPool = await childPool.connect(deployer).init(
        mockFxStateChildTunnel.address,
        mockMaticToken.address,
        stMaticToken.address,
        shuttleExpiry,
        ownerAddress
    );
    await initPool.wait();


    return { childPool, mockMaticToken, mockFxStateChildTunnel, stMaticToken };
}

export const getShuttleInEnrouteState = async(
    deployer: SignerWithAddress,
    shuttleExpiry: number,
    owner: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress
) => {
    const { childPool, mockMaticToken, mockFxStateChildTunnel, stMaticToken } = await deployChildPool(deployer, shuttleExpiry, owner.address);

    let amount = ethers.utils.parseEther("1");
    await childPool.connect(user1).deposit(amount, {
        value: amount
    });

    amount = ethers.utils.parseEther("2");

    // deposit user 2
    await childPool.connect(user2).deposit(amount, {
        value: amount
    })

    await childPool.connect(owner).enrouteShuttle(1)

    return {childPool, mockMaticToken, mockFxStateChildTunnel, stMaticToken};
}

export const deployMockERC20 = async(deployer: SignerWithAddress) => {
    const MockERC20 = await ethers.getContractFactory(
        "MockERC20"
    );

    const mockERC20 = await MockERC20.connect(deployer).deploy(
        "MOCK", "MOCK", deployer.address, ethers.utils.parseEther("1000000")
    );
    return mockERC20;
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

export enum ShuttleProcessingStatus {
    PROCESSED=0,
    CANCELLED=1
}

export enum ShuttleStatus {
    AVAILABLE = 0,
    ENROUTE = 1,
    ARRIVED = 2,
    EXPIRED = 3,
    CANCELLED =4
}