// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.7;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ICampaign {

    enum CampaignStatus {
        ACTIVE,
        PAUSED,
        DELETED
    }

    event RewardClaimed(
        uint256 shuttleNumber,
        uint256 campaignNumber,
        uint256 rewardAmount,
        address sender
    );

    event CampaignCreated(
        uint256 campaignNumber,
        uint256 totalRewardAmount,
        uint256 startShuttle,
        uint256 endShuttle,
        uint256 rewardAmountPerShuttle,
        address rewardToken
    );

    event CampaignStatusModified(
        uint256 campaignNumber,
        CampaignStatus campaignStatus
    );

    struct ACampaign {
        uint256 startShuttleNum;
        uint256 endShuttleNum;
        uint256 totalRewardAmount;
        uint256 totalClaimedAmount;
        uint256 rewardAmountPerShuttle;
        CampaignStatus campaignStatus;
        IERC20 rewardToken;
    }
}
