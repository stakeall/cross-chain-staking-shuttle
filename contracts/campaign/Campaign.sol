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
        uint256 totalShuttles_ = _endShuttle.sub(_startShuttle).add(1);
        uint256 rewardAmountPerShuttle_ = _totalRewardAmount.div(totalShuttles_);

        currentCampaign = currentCampaign.add(1);
        campaigns[currentCampaign] = ShuttleCampaign({
            startShuttleNum: _startShuttleNum,
            endShuttleNum: _endShuttleNum,
            totalRewardAmount: _totalRewardAmount,
            totalClaimedAmount: 0,
            rewardAmountPerShuttle: rewardAmountPerShuttle_,
            rewardToken: _rewardToken
        });
        
        emit CampaignCreated(currentCampaign, _totalRewardAmount, _startShuttleNum, _endShuttleNum, address(_rewardToken));
    }

    function claim(
        uint256 _shuttleNumber,
        uint256 _campaignNumber,
        uint256 _userAmount,
        uint256 _totalAmount,
        address payable _sender
    ) external onlyChildPool {
        require(
            _shuttleNumber >= campaigns[_campaignNumber].startShuttleNum && 
            _shuttleNumber <= campaigns[_campaignNumber].endShuttleNum, 
            "!No Shuttle in Campaign"
        );
        
        uint256 rewardAmount_ = campaigns[_campaignNumber].rewardAmountPerShuttle.mul(_userAmount).div(_totalAmount);

        campaigns[_campaignNumber].rewardToken.transfer(rewardAmount_, _sender);

        emit RewardClaimed(_shuttleNumber, _campaignNumber, rewardAmount_, _sender);        
    }


}