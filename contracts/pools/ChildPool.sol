// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.7;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./IChildPool.sol";
import "./PoolSecurityModule.sol";

/**
 * Manages user deposits for staking on child chain.
 */
contract ChildPool is IChildPool, PoolSecurityModule {
    using SafeMath for uint256;

    IFxStateChildTunnel public childTunnel;
    IMaticToken public maticToken;
    IERC20 public stMaticToken;
    IFundCollector public fundCollector; 
    uint256 public shuttleExpiry;
    uint256 public currentShuttle;
    uint256 public enroutedShuttle;
    uint256 public availableMaticBalance;
    uint256 public availableStMaticBalance;
    uint256 public fee;
    address public feeBeneficiary;
    uint256 public constant FEE_DENOMINATOR = 10000;

    mapping(uint256 => Shuttle) public shuttles;
    mapping(uint256 => mapping(address => uint256)) public balances;

    ICampaign public campaign;
    
    /**
     * @dev Initialize the contract, setup roles and create first shuttle
     *
     * @param _childTunnel - Address of the child tunnel.
     * @param _maticToken - Address of MATIC token on Polygon Mainnet
     * @param _stMaticToken - Address of stMatic on Polygon Mainnet
     * @param _fundCollector - Address of fund collector contract
     * @param _shuttleExpiry - Expiry of shuttle in blocks
     * @param _fee - Fee percentange on base 10000 that will be charged on successful arrival of shuttle.
     * @param _feeBeneficiary - Address to which fee will be transferred.
     * @param _owner - Address of the owner
     */
    function initialize(
        IFxStateChildTunnel _childTunnel,
        IMaticToken _maticToken,
        IERC20 _stMaticToken,
        IFundCollector _fundCollector, 
        uint256 _shuttleExpiry,
        uint256 _fee,
        address _feeBeneficiary,
        address _owner
    ) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        childTunnel = _childTunnel;
        maticToken = _maticToken;
        fundCollector = _fundCollector;
        stMaticToken = _stMaticToken;
        shuttleExpiry = _shuttleExpiry;
        fee = _fee;
        feeBeneficiary = _feeBeneficiary;

        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
        _setupRole(OPERATOR_ROLE, _owner);
        _setupRole(CANCEL_ROLE, _owner);
        _setupRole(PAUSE_ROLE, _owner);
        _setupRole(GOVERNANCE_ROLE, _owner);

        _createNewShuttle();
    }

    function _createNewShuttle() internal {
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
     */
    function deposit() external payable whenNotPaused {
        require(msg.value > 0, "!amount");

        uint256 amount = msg.value;

        balances[currentShuttle][msg.sender] = balances[currentShuttle][
            msg.sender
        ].add(amount);

        shuttles[currentShuttle].totalAmount = shuttles[currentShuttle]
            .totalAmount
            .add(amount);

        availableMaticBalance = availableMaticBalance.add(amount);

        emit Deposit(currentShuttle, msg.sender, amount);
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
        external
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

        _createNewShuttle();

        emit ShuttleEnrouted(enroutedShuttle, amount);
    }

    function calculateFee(uint256 _amount)
        internal
        view
        returns (uint256 fee_)
    {
        fee_ = _amount.mul(fee).div(FEE_DENOMINATOR);
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
        external
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

        require(
            shuttleNumber == _shuttleNumber,
            "!shuttle message not recieved"
        );

        uint256 shuttleFee = 0;
        // reset it so that next shuttle can be enrouted
        enroutedShuttle = 0;

        if (shuttleProcessingStatus == ShuttleProcessingStatus.PROCESSED) {
            // make sure stMatic is arrived from bridge
            require(
                stMaticToken.balanceOf(address(this)) >=
                    availableStMaticBalance.add(amount),
                "!insufficient stMatic balance"
            );

            shuttleFee = calculateFee(amount);
            uint256 recievedToken = amount.sub(shuttleFee);
            availableStMaticBalance = availableStMaticBalance.add(
                recievedToken
            );

            shuttles[_shuttleNumber].recievedToken = recievedToken;
            shuttles[_shuttleNumber].status = ShuttleStatus.ARRIVED;

            stMaticToken.transfer(feeBeneficiary, shuttleFee);
        } else if (
            shuttleProcessingStatus == ShuttleProcessingStatus.CANCELLED
        ) {

            // Collect funds send by rootPool after shuttle cancellation
            fundCollector.withdrawFunds(amount);

            // make sure Matic base token is arrived from bridge in case on cancellation
            require(
                address(this).balance >=
                    availableMaticBalance.add(
                        shuttles[shuttleNumber].totalAmount
                    ),
                "!insufficient Matic balance"
            );

            availableMaticBalance = availableMaticBalance.add(amount);
            shuttles[_shuttleNumber].recievedToken = 0;
            shuttles[_shuttleNumber].status = ShuttleStatus.CANCELLED;
        }

        emit ShuttleArrived(
            shuttleNumber,
            amount,
            shuttles[_shuttleNumber].status,
            shuttleFee
        );
    }

    /**
     * @dev Returns amount of estimated stMatic token.
     *
     * @param _balance Balance of user in shuttle.
     * @param _recievedToken Total StMatic amount recieved to a shuttle.
     * @param _totalAmount Total matic deposited into shuttle.
     */
    function calculateStMaticAmount(
        uint256 _balance,
        uint256 _recievedToken,
        uint256 _totalAmount
    ) public pure returns (uint256 amount_) {
        amount_ = (_balance.mul(_recievedToken)).div(_totalAmount);
    }

    /**
     * @dev This function allows users to claim their funds. There are three cases to it.
     *  1. Shuttle status is arrived: If shuttle is successfully processed and arrived. Users can claim stMatic token.
     *  2. If shuttle is marked as expired, then users can claim deposited matic tokens.
     *  3. If shuttle is marked as cancelled, then users can claim deposited matic tokens
     *
     * @param _shuttleNumber Shuttle number for which user want's to claim token
     *
     */
    function _claim(uint256 _shuttleNumber) internal {
        Shuttle memory shuttle = shuttles[_shuttleNumber];
        ShuttleStatus status = shuttle.status;

        require(
            status == ShuttleStatus.ARRIVED ||
                status == ShuttleStatus.EXPIRED ||
                status == ShuttleStatus.CANCELLED,
            "!invalid shuttle status"
        );

        uint256 balance = balances[_shuttleNumber][msg.sender];
        balances[_shuttleNumber][msg.sender] = 0;

        address payable beneficiary = payable(msg.sender);

        require(balance > 0, "!amount");

        if (status == ShuttleStatus.ARRIVED) {
            // calculate stMatic Amount
            uint256 stMaticAmount = calculateStMaticAmount(
                balance,
                shuttles[_shuttleNumber].recievedToken,
                shuttles[_shuttleNumber].totalAmount
            );

            availableStMaticBalance = availableStMaticBalance.sub(
                stMaticAmount
            );
            stMaticToken.transfer(beneficiary, stMaticAmount);

            emit TokenClaimed(
                _shuttleNumber,
                address(stMaticToken),
                address(beneficiary),
                stMaticAmount
            );
        } else {
            availableMaticBalance = availableMaticBalance.sub(balance);
            beneficiary.transfer(balance);
            emit TokenClaimed(
                _shuttleNumber,
                address(maticToken),
                address(beneficiary),
                balance
            );
        }
    }


    /**
     * @dev - This function calls the claimRewards method on the campaign, if shuttle status is arrived.
     *
     * @param _shuttleNumber - Shuttle number from which the user wants to claim.
     * @param _campaignNumber - Campaign number from which the reward has to be claimed.
     * @param _userAmount - amount the user deposited in that shuttle.
     * @param _totalAmount - total amount of the shuttle.   
     */
    function _claimRewards(
        uint256 _shuttleNumber,
        uint256 _campaignNumber,
        uint256 _userAmount,
        uint256 _totalAmount,

    ) internal {
        Shuttle memory shuttle = shuttles[_shuttleNumber];
        ShuttleStatus status = shuttle.status;

        require(
            status == ShuttleStatus.ARRIVED, 
            "!no rewards"
        );

        address payable beneficiary = payable(msg.sender);

        campaign.claimRewards(
            _shuttleNumber,
            _campaignNumber,
            _userAmount,
            _totalAmount,
            beneficiary
        );
    }

    /**
     * @dev - calls the internal _claim method.
     *
     * @param _shuttleNumber - Shuttle number from which user wants to claim.
    */
    function claim(uint256 _shuttleNumber) external nonReentrant whenNotPaused {
        _claim(_shuttleNumber);
    }


    /**
     * @dev - This function allows to claim funds along with the rewards during an active campaign.
     * 1. call the internal claim to claim funds.
     * 2. call the internal claimRewards to claim the rewards.
     *
     * @param _shuttleNumber - Shuttle number from which the user wants to claim.
     * @param _campaignNumber - Campaign number from which to claim the reward.
     */
    function claimWithRewards(uint256 _shuttleNumber, uint256 _campaignNumber) external nonReentrant whenNotPaused {
        uint256 userAmount = balances[_shuttleNumber][msg.sender];
        uint256 totalAmount = shuttles[_shuttleNumber].totalAmount;
    
        _claim(_shuttleNumber);

        _claimRewards(_shuttleNumber, _campaignNumber, userAmount, totalAmount);
        
    }

    /**
     * @dev If a shuttle is not enrouted after a specific block delay of `shuttleExpiry` then any one can call this function and mark shuttle as expired.
     *      Once the shuttle is marked as expired, users can claim their deposited MATIC tokens.
     *
     * @param _shuttleNumber Id of shuttle
     *
     */
    function expireShuttle(uint256 _shuttleNumber) external whenNotPaused {
        require(
            _shuttleNumber == currentShuttle,
            "!only current shuttle allowed"
        );
        Shuttle memory shuttle = shuttles[_shuttleNumber];

        require(shuttle.totalAmount > 0, "!Not ready for expiry");

        require(block.number >= shuttle.expiry, "!not ready to expire");

        shuttles[_shuttleNumber].status = ShuttleStatus.EXPIRED;

        _createNewShuttle();
        emit ShuttleExpired(_shuttleNumber);
    }

    /**
     * @dev Operator can cancel shuttle which is in available status, users will be able to claim deposited matic tokens once shuttle is cancelled.
     *
     * @param _shuttleNumber Id of shuttle.
     */
    function cancelShuttle(uint256 _shuttleNumber)
        external
        onlyRole(OPERATOR_ROLE)
    {
        require(
            _shuttleNumber == currentShuttle,
            "!only current shuttle allowed"
        );
        Shuttle memory shuttle = shuttles[_shuttleNumber];
        require(shuttle.status == ShuttleStatus.AVAILABLE, "!invalid status");

        shuttles[_shuttleNumber].status = ShuttleStatus.CANCELLED;
        _createNewShuttle();
        emit ShuttleCancelled(_shuttleNumber);
    }

    /** Setter */

    /**
     *
     * @dev Set's the fee percentange. Fee percentage is set at base 10000.
     *
     * @param _fee Fee percentage with 10000 as hundred percentage.
     */
    function setFee(uint256 _fee) external onlyRole(GOVERNANCE_ROLE) {

        require(_fee <= FEE_DENOMINATOR, "!fee");
        fee = _fee;
        emit FeeChanged(fee);
    }

    /**
     *
     * @dev Set's the shuttle expiry blocks.
     *
     * @param _shuttleExpiry shuttle expiry in blocks.
     */
    function setShuttleExpiry(uint256 _shuttleExpiry)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        require(_shuttleExpiry > 0, "Invalid shuttle expiry");

        shuttleExpiry = _shuttleExpiry;
        emit ShuttleExpiryChanged(shuttleExpiry);
    }

    /**
     * @dev This will set address of fund collector contract 
     *
     * @param _fundCollector Address of fund collector contract. 
     */
    function setChildPoolFeeCollector(address _fundCollector)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        require(_fundCollector != address(0), "!fundCollector");
        
        fundCollector = IFundCollector(_fundCollector);
    }

    /**
     * @dev This will set address of fee beneficiary
     *
     * @param _feeBeneficiary Address of fee beneficiary. 
     */
    function setFeeBeneficiary(address _feeBeneficiary)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        require(_feeBeneficiary != address(0), "!feeBeneficiary");
        
        feeBeneficiary = _feeBeneficiary;
    }

    function setCampaign(ICampaign _campaign) 
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        require(address(_campaign) != address(0), "!Zero address");

        campaign = _campaign;

        emit CampaignChanged(address(campaign));
    }

    receive() external payable {}

    fallback() external payable {}

}
