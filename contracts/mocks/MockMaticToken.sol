// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import  { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockMaticToken {
 
    uint256 public withdrawAmount;

    function withdraw(uint256 _amount) public payable {
        withdrawAmount = _amount;
    }

}
