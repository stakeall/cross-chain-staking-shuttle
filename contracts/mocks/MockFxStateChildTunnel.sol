// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

contract MockFxStateChildTunnel {
    bytes public data;

    function sendMessageToRoot(bytes memory _data) public {
        data = _data;
    }
}
