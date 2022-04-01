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
    event Deposit(uint256 _shuttlesNumber, address _sender, uint256 _amount);
    event ShuttleEnrouted(uint256 _shuttleNumber, uint256 _amount);
    event ShuttleProcessed(
        uint256 _shuttleNumber,
        uint256 _stakeAmount,
        uint256 _stMaticAmount,
        ShuttleProcessingStatus _processingStatus
    );
    event ShuttleArrived(
        uint256 _shuttleNumber,
        uint256 _amount,
        ShuttleStatus _status,
        uint256 _shuttleFee
    );
    event TokenClaimed(
        uint256 _shuttleNumber,
        address _token,
        address _beneficiary,
        uint256 _claimedAmount
    );

    event ShuttleExpired(uint256 _shuttleNumber);
}

enum ShuttleProcessingStatus {
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
            ShuttleProcessingStatus
        );
}

interface IMaticToken {
    function withdraw(uint256) external payable;
}

interface IFxStateRootTunnel {
    function receiveMessage(bytes memory message) external;

    function sendMessageToChild(bytes memory message) external;

    function readData() external returns (uint256, uint256);
}

interface IWithdrawManagerProxy {
    function processExits(address token) external;
}

interface IERC20PredicateBurnOnly {
    function startExitWithBurntTokens(bytes calldata data) external;
}

interface IDepositManagerProxy {
    function depositERC20ForUser(
        address token,
        address user,
        uint256 amount
    ) external;
}

interface IPolidoAdapter {
    function depositForAndBridge(address _beneficiary, uint256 _amount)
        external
        returns (uint256);
}
