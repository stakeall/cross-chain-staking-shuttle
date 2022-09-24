// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.7;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./ICampaign.sol";
import "./CampaignSecurityModule.sol";

/**
 * Manages N number of campaigns and the distribution of rewards 
 * to the users who have staked to the childPool.
 */
contract Campaign is ICampaign, CampaignSecurityModule {

    uint256 public currentCampaign;
    address public owner;
    address public childPool;

    mapping(uint256 => ACampaign) public campaigns;

    modifier onlyChildPool(){
        require(msg.sender == childPool, "!ChildPool");
        _;
    }

    function _onlyGovernance() internal view {
        _checkRole(GOVERNANCE_ROLE, msg.sender);
    }

    /**
     * @dev - Initialize the contract and setup roles.
     * 
     * @param _owner - Address of the owner.
     * @param _childPool - Address of the childPool.
     */
    function initialize(
        address _owner,
        address _childPool
    ) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        owner = _owner;
        childPool = _childPool;

        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
        _setupRole(GOVERNANCE_ROLE, _owner);
        _setupRole(CANCEL_ROLE, _owner);
        _setupRole(PAUSE_ROLE, _owner);

    }


    /**
     * @dev - Create a new campaign.
     *
     * @param _startShuttleNum - First shuttle number from which the campaign starts.
     * @param _endShuttleNum - Last shuttle number inclusive till which the campaign runs.
     * @param _totalRewardAmount - Total reward amount offered in the campaign.
     * @param _rewardToken - Address of the ERC20 reward token.
     */
    function createCampaign(
        uint256 _startShuttleNum,
        uint256 _endShuttleNum,
        uint256 _totalRewardAmount,
        IERC20 _rewardToken
    ) external {
        _onlyGovernance();
        uint256 totalShuttles_ = _endShuttleNum - _startShuttleNum + 1;
        uint256 rewardAmountPerShuttle_ = _totalRewardAmount / totalShuttles_;
        uint256 currentCampaign_ = currentCampaign + 1;

        currentCampaign = currentCampaign_;
        campaigns[currentCampaign_] = ACampaign({
            startShuttleNum: _startShuttleNum,
            endShuttleNum: _endShuttleNum,
            totalRewardAmount: _totalRewardAmount,
            totalClaimedAmount: 0,
            rewardAmountPerShuttle: rewardAmountPerShuttle_,
            campaignStatus: CampaignStatus.ACTIVE,
            rewardToken: _rewardToken
        });
        
        emit CampaignCreated(
            currentCampaign_,
            _totalRewardAmount,
            _startShuttleNum,
            _endShuttleNum,
            rewardAmountPerShuttle_,
            address(_rewardToken)
        );
    }


    /**
     * @dev - Modify the status of any existing campaign.
     *
     * @param _campaignNumber - Number of the campaign.
     * @param _campaignStatus - status of the campaign.
     */
    function _modifyCampaignStatus(
        uint256 _campaignNumber,
        CampaignStatus _campaignStatus
    ) internal {
        if (_campaignNumber > currentCampaign)
            revert InvalidCampaign();
        
        CampaignStatus campaignStatus_ = campaigns[_campaignNumber].campaignStatus;

        if (_campaignStatus == campaignStatus_)
            revert SameCampaignStatus();

        campaigns[_campaignNumber].campaignStatus = _campaignStatus;

        emit CampaignStatusModified(_campaignNumber, _campaignStatus);
    }


    /**
     * @dev - To delete a campaign.
     *
     * @param _campaignNumber - The campaign number to identify the campaign.
     */
    function deleteCampaign(
        uint256 _campaignNumber
    ) external {
        _onlyGovernance();
        _modifyCampaignStatus(
            _campaignNumber,
            CampaignStatus.DELETED
        );
    }

    /** 
     * @dev - To pause a campaign.
     *
     * @param _campaignNumber - The campaign number to identify the campaign.
    */
    function pauseCampaign(
        uint256 _campaignNumber
    ) external {
        _onlyGovernance();
        _modifyCampaignStatus(
            _campaignNumber,
            CampaignStatus.PAUSED
        );
    }


    /**
     * @dev - Unpause a campaign
     *
     * @param _campaignNumber - The campaign number to identify the campaign.
     */
    function unpauseCampaign(
        uint256 _campaignNumber
    ) external {
        _onlyGovernance();
        _modifyCampaignStatus(
            _campaignNumber,
            CampaignStatus.ACTIVE
        );
    }

    /**
     * @dev - To transfer rewards for the user based on the shares one has in the shuttle.
     *
     * @param _shuttleNumber - Shuttle number in which user has made deposits.
     * @param _campaignNumber - Number of the campaign in which the shuttle was a part of.
     * @param _userAmount - Amount the user deposited in the shuttle.
     * @param _totalAmount - Amount of the deposits made to the shuttle.
     * @param _sender - Address of the user.
     */
    function claimRewards(
        uint256 _shuttleNumber,
        uint256 _campaignNumber,
        uint256 _userAmount,
        uint256 _totalAmount,
        address payable _sender
    ) external onlyChildPool {
        ACampaign memory campaign_ = campaigns[_campaignNumber];

        if (campaign_.campaignStatus != CampaignStatus.ACTIVE)
            revert InactiveCampaign();

        if (_shuttleNumber < campaign_.startShuttleNum || _shuttleNumber > campaign_.endShuttleNum)
            revert ShuttleNotPartOfCampaign();
        
        uint256 rewardAmount_ = campaign_.rewardAmountPerShuttle * _userAmount / _totalAmount;
        uint256 totalClaimedAmount_ = campaign_.totalClaimedAmount + rewardAmount_;

        if (campaign_.totalRewardAmount < totalClaimedAmount_)
            revert NotEnoughRewardAmount();

        campaigns[_campaignNumber].totalClaimedAmount = totalClaimedAmount_;

        campaign_.rewardToken.transfer(_sender, rewardAmount_);

        emit RewardClaimed(_shuttleNumber, _campaignNumber, rewardAmount_, _sender);        
    }

    /**
     * @dev - Transfer unused reward tokens to the owner.
     *
     * @param _rewardToken - Address of the rewardToken.
     * @param _amount - Amount to be transferred.
     */
    function transferUnusedRewards(
        IERC20 _rewardToken,
        uint256 _amount
    ) external {
        _onlyGovernance();
        require(_amount <= _rewardToken.balanceOf(address(this)), "!amount");

        _rewardToken.transfer(owner, _amount);
    }
}