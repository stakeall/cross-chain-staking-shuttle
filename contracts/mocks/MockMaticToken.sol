// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

contract MockMaticToken {
 
    uint256 public withdrawAmount;

    function withdraw(uint256 _amount) public payable {
        withdrawAmount = _amount;
    }

}
