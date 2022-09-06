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
        
        emit CampaignCreated(currentCampaign, _totalRewardAmount, _startShuttleNum, _endShuttleNum, address(_rewardToken));
    }

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

    function deleteCampaign(
        uint256 _campaignNumber
    ) external onlyRole(GOVERNANCE_ROLE) {
        _modifyCampaignStatus(
            _campaignNumber,
            CampaignStatus.DELETED
        );
    }

    function pauseCampaign(
        uint256 _campaignNumber
    ) external onlyRole(GOVERNANCE_ROLE) {
        _modifyCampaignStatus(
            _campaignNumber,
            CampaignStatus.PAUSED
        );
    }

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