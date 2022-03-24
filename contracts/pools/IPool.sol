pragma solidity ^0.8.3;

contract IPool {
    enum ShuttleStatus {
        AVAILABLE,
        ENROUTE,
        ARRIVED,
        EXPIRED,
        CANCELLED
    }

    struct Shuttle {
        uint256 totalAmount;
        ShuttleStatus status;
        uint256 recievedToken;
        uint256 expiry;
    }

    event ShuttleCreated(uint256 _shuttleNumber);
}

enum RootShuttleStatus {
    PROCESSED,
    CANCELLED 
}

interface IFxStateChildTunnel {
    function sendMessageToRoot(bytes memory message) external;

    function readData()
        external
        returns (
            uint256,
            uint256,
            RootShuttleStatus
        );
}

interface IMaticToken {
    function withdraw(uint256) external payable;
}
