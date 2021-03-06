import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

export const deployChildPool = async (
    deployer: SignerWithAddress,
    shuttleExpiry: number,
    ownerAddress: string,
    feeBeneficiary: string,
    fee: number = 500,
) => {

    const mockMaticToken = await deployMockMaticToken(deployer);
    const mockFxStateChildTunnel = await deployMockFxStateChildTunnel(deployer);
    const stMaticToken = await deployMockERC20(deployer);

    const FundCollector = await ethers.getContractFactory(
        "FundsCollector"
    );

    const fundCollector = await FundCollector.connect(deployer).deploy();
    await fundCollector.deployed();
    
    const ChildPool = await ethers.getContractFactory(
        "ChildPool"
    );
    const childPool = await ChildPool.connect(deployer).deploy();
    await childPool.deployed();

    await fundCollector.setChildPool(childPool.address);

    const initPool = await childPool.connect(deployer).initialize(
        mockFxStateChildTunnel.address,
        mockMaticToken.address,
        stMaticToken.address,
        fundCollector.address,
        shuttleExpiry,
        fee,
        feeBeneficiary,
        ownerAddress,
    );
    await initPool.wait();


    return { childPool, mockMaticToken, mockFxStateChildTunnel, stMaticToken, fundCollector };
}

export const getShuttleInEnrouteState = async (
    deployer: SignerWithAddress,
    shuttleExpiry: number,
    owner: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress
) => {
    const { childPool, mockMaticToken, mockFxStateChildTunnel, stMaticToken, fundCollector } = await deployChildPool(deployer, shuttleExpiry, owner.address, deployer.address);

    let amount = ethers.utils.parseEther("1");
    await childPool.connect(user1).deposit({
        value: amount
    });

    amount = ethers.utils.parseEther("2");

    // deposit user 2
    await childPool.connect(user2).deposit({
        value: amount
    })

    await childPool.connect(owner).enrouteShuttle(1)

    return { childPool, mockMaticToken, mockFxStateChildTunnel, stMaticToken, fundCollector };
}

export const getShuttleInArrivedState = async (
    deployer: SignerWithAddress,
    shuttleExpiry: number,
    owner: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress,
    status: ShuttleProcessingStatus = ShuttleProcessingStatus.PROCESSED,
    depositAmount: string = "2"
) => {
    const { childPool, mockMaticToken, mockFxStateChildTunnel, stMaticToken, fundCollector } = await getShuttleInEnrouteState(deployer, shuttleExpiry, owner, user1, user2);

    const shuttleArrivalData = {
        stMaticAmount: ethers.utils.parseEther(depositAmount || "2"),
        shuttleProcessingStatus: status,
        shuttleNumber: 1
    }

    const encodedMessageData = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "uint256", "uint8"],
        [shuttleArrivalData.shuttleNumber, shuttleArrivalData.stMaticAmount, shuttleArrivalData.shuttleProcessingStatus]
    );

    // mock message arrival 
    await mockFxStateChildTunnel.setLatestData(encodedMessageData);
    // mock token arrival 
    if (status == ShuttleProcessingStatus.PROCESSED) {
        await stMaticToken.mint(childPool.address, shuttleArrivalData.stMaticAmount);
    } else {
        // mock token arrival 
        await deployer.sendTransaction({
            to: fundCollector.address,
            value: shuttleArrivalData.stMaticAmount,
            from: deployer.address
        })
    }


    await childPool.connect(owner).arriveShuttle(1);

    return { childPool, mockMaticToken, mockFxStateChildTunnel, stMaticToken, fundCollector };

}

export const deployMockERC20 = async (deployer: SignerWithAddress) => {
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
    PROCESSED = 0,
    CANCELLED = 1
}

export enum ShuttleStatus {
    UNAVAILABLE = 0,
    AVAILABLE = 1,
    ENROUTE = 2,
    ARRIVED = 3,
    EXPIRED = 4,
    CANCELLED = 5
}