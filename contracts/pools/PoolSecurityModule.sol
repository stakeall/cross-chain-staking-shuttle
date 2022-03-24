pragma solidity ^0.8.3;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PoolSecurityModule is AccessControl, Pausable, ReentrancyGuard {

    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant CANCEL_ROLE = keccak256("CANCEL_ROLE");
    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");
    
    function pause() public onlyRole(PAUSE_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSE_ROLE) {
        _unpause();
    }
}
