// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.7;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./ICampaign.sol";
import "./CampaignSecurityModule.sol";

contract Campaign is ICampaign, CampaignSecurityModule {
    using SafeMath for uint256;

    uint256 public currentCampaign;
    address public owner;
    address public childPool;

    mapping(uint256 => ACampaign) public campaigns;

    modifier onlyChildPool(){
        require(msg.sender == childPool, "!ChildPool");
        _;
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
    ) external onlyRole(GOVERNANCE_ROLE) {
        uint256 totalShuttles_ = _endShuttleNum.sub(_startShuttleNum).add(1);
        uint256 rewardAmountPerShuttle_ = _totalRewardAmount.div(totalShuttles_);

        currentCampaign = currentCampaign.add(1);
        campaigns[currentCampaign] = ACampaign({
            startShuttleNum: _startShuttleNum,
            endShuttleNum: _endShuttleNum,
            totalRewardAmount: _totalRewardAmount,
            totalClaimedAmount: 0,
            rewardAmountPerShuttle: rewardAmountPerShuttle_,
            campaignStatus: CampaignStatus.ACTIVE,
            rewardToken: _rewardToken
        });
        
        emit CampaignCreated(
            currentCampaign,
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
        require (_campaignNumber <= currentCampaign, "!No campaign");

        CampaignStatus campaignStatus_ = campaigns[_campaignNumber].campaignStatus;

        require(_campaignStatus != campaignStatus_, "!Same campaign status");

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
    ) external onlyRole(GOVERNANCE_ROLE) {
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
    ) external onlyRole(GOVERNANCE_ROLE) {
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
    ) external onlyRole(GOVERNANCE_ROLE) {
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
        require(
            campaigns[_campaignNumber].campaignStatus == CampaignStatus.ACTIVE,
            "!inActive Campaign"
        );

        require(
            _shuttleNumber >= campaigns[_campaignNumber].startShuttleNum && 
            _shuttleNumber <= campaigns[_campaignNumber].endShuttleNum, 
            "!Shuttle not in Campaign"
        );
        
        uint256 rewardAmount_ = campaigns[_campaignNumber].rewardAmountPerShuttle.mul(_userAmount).div(_totalAmount);
        uint256 totalClaimedAmount_ = campaigns[_campaignNumber].totalClaimedAmount.add(rewardAmount_);

        require(
            campaigns[_campaignNumber].totalRewardAmount >=
            totalClaimedAmount_,
            "!Not enough reward amount"
        );

        campaigns[_campaignNumber].totalClaimedAmount = totalClaimedAmount_;

        campaigns[_campaignNumber].rewardToken.transfer(_sender, rewardAmount_);

        emit RewardClaimed(_shuttleNumber, _campaignNumber, rewardAmount_, _sender);        
    }


}