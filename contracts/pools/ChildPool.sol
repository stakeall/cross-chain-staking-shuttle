pragma solidity ^0.8.3;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./IPool.sol";
import { IFxStateChildTunnel } from "./IPool.sol";
import "./PoolSecurityModule.sol";

/**
 * Manages user deposits for staking on child chain.
 */
contract ChildPool is IPool, PoolSecurityModule {
    using SafeMath for uint256;

    IFxStateChildTunnel public childTunnel;
    IMaticToken public maticToken;
    IERC20 public stMaticToken;
    uint256 public shuttleExpiry;
    uint256 public currentShuttle;
    uint256 public enroutedShuttle;
    uint256 public availableMaticBalance;
    uint256 public availableStMaticBalance;

    mapping(uint256 => Shuttle) public shuttles;
    mapping(uint256 => mapping(address => uint256)) public balances;

    /**
     * Initialize the contract, setup roles and create first shuttle
     *
     * @param _childTunnel - Address of the child tunnel.
     * @param _maticToken - Address of MATIC token on Polygon Mainnet
     * @param _stMaticToken - Address of stMatic on Polygon Mainnet
     * @param _shuttleExpiry - Expiry of shuttle in blocks
     * @param _owner - Address of the owner
     */
    function init(
        IFxStateChildTunnel _childTunnel,
        IMaticToken _maticToken,
        IERC20 _stMaticToken,
        uint256 _shuttleExpiry,
        address _owner
    ) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        childTunnel = _childTunnel;
        maticToken = _maticToken;
        stMaticToken = _stMaticToken;
        shuttleExpiry = _shuttleExpiry;

        currentShuttle = 0;
        enroutedShuttle = 0;
        availableMaticBalance = 0;
        availableStMaticBalance = 0;

        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
        _setupRole(OPERATOR_ROLE, _owner);
        _setupRole(CANCEL_ROLE, _owner);
        _setupRole(PAUSE_ROLE, _owner);
        _setupRole(GOVERNANCE_ROLE, _owner);

        createNewShuttle();
    }

    function createNewShuttle() internal {
        currentShuttle = currentShuttle.add(1);
        shuttles[currentShuttle] = Shuttle({
            totalAmount: 0,
            status: ShuttleStatus.AVAILABLE,
            recievedToken: 0,
            expiry: block.number.add(shuttleExpiry)
        });
        emit ShuttleCreated(currentShuttle);
    }

    /**
     * @dev Deposit Matic tokens to current shuttle
     *
     * @param _amount - Amount of matic to deposited in the current shuttle.
     */
    function deposit(uint256 _amount) public payable whenNotPaused {
        require(_amount > 0, "!amount");
        require(msg.value == _amount, "!mismatch amount");
        require(
            shuttles[currentShuttle].status == ShuttleStatus.AVAILABLE,
            "!Shuttle"
        );

        balances[currentShuttle][msg.sender] = balances[currentShuttle][
            msg.sender
        ].add(_amount);

        shuttles[currentShuttle].totalAmount = shuttles[currentShuttle]
            .totalAmount
            .add(_amount);

        availableMaticBalance = availableMaticBalance.add(_amount);

        emit Deposit(currentShuttle, msg.sender, _amount);
    }

    /**
     * @dev Enroute Shuttle: Trigger crosschain transfer of funds
     *   - Withdraw funds to rootPool
     *   - Send a message to root pool
     *
     * @param _shuttleNumber Shuttle Number that should be enrouted.
     *
     */
    function enrouteShuttle(uint256 _shuttleNumber)
        public
        whenNotPaused
        onlyRole(OPERATOR_ROLE)
    {
        require(enroutedShuttle == 0, "!already enrouted shuttle");
        require(
            shuttles[_shuttleNumber].status == ShuttleStatus.AVAILABLE,
            "!status"
        );
        uint256 amount = shuttles[_shuttleNumber].totalAmount;
        require(amount > 0, "!amount");

        enroutedShuttle = _shuttleNumber;
        shuttles[_shuttleNumber].status = ShuttleStatus.ENROUTE;

        availableMaticBalance = availableMaticBalance.sub(amount);

        maticToken.withdraw{value: amount}(amount);
        childTunnel.sendMessageToRoot(abi.encode(enroutedShuttle, amount));

        createNewShuttle();

        emit ShuttleEnrouted(enroutedShuttle, amount);
    }

    /**
     * @dev This function will be called by operator once funds and message is recieved from root chain. There are two different kind of messages that can be recieved.
     * 1. PROCESSED: If shuttle on root chain is processed, then this function will change shuttle status to ARRIVED and users can claim stMatic
     * 2. CANCELLED: If shuttle on root chain is cancelled, then this function will change shuttle status to CANCELLED and users can claim MATIC token.
     *
     * _shuttleNumber: Shuttle number that should be marked as arrived. 
     *
     */
    function arriveShuttle(uint256 _shuttleNumber)
        public
        whenNotPaused
        onlyRole(OPERATOR_ROLE)
    {
        require(
            enroutedShuttle == _shuttleNumber,
            "!Shuttle should be enrouted"
        );
        require(
            shuttles[_shuttleNumber].status == ShuttleStatus.ENROUTE,
            "!status"
        );

        (
            uint256 shuttleNumber,
            uint256 amount,
            ShuttleProcessingStatus shuttleProcessingStatus
        ) = childTunnel.readData();

        require(shuttleNumber == _shuttleNumber, "!shuttle message not recieved");

        if (
            shuttleProcessingStatus == ShuttleProcessingStatus.PROCESSED
        ) {
            // make sure stMatic is arrived from bridge
            require(stMaticToken.balanceOf(address(this)) >= availableStMaticBalance.add(amount), "!insufficient stMatic balance");

            availableStMaticBalance = availableStMaticBalance.add(amount);
            shuttles[_shuttleNumber].recievedToken = amount;
            shuttles[_shuttleNumber].status = ShuttleStatus.ARRIVED;


        } else if (
            shuttleProcessingStatus == ShuttleProcessingStatus.CANCELLED
        ) {

            // make sure Matic base token is arrived from bridge in case on cancellation
            require(address(this).balance >= availableMaticBalance.add(shuttles[shuttleNumber].totalAmount), "!insufficient Matic balance");

            availableMaticBalance = availableMaticBalance.add(amount);
            shuttles[_shuttleNumber].recievedToken = 0;
            shuttles[_shuttleNumber].status = ShuttleStatus.CANCELLED;
        }

        // reset it so that next shuttle can be enrouted 
        enroutedShuttle = 0;

        emit ShuttleArrived(shuttleNumber, amount, shuttles[_shuttleNumber].status);
    }


    //todo decide on receive vs fallback
   receive() external payable {
        
    }
}
