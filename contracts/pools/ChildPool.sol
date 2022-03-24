pragma solidity ^0.8.3;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./IPool.sol";
import {IFxStateChildTunnel} from "./IPool.sol";
import "./PoolSecurityModule.sol";

contract ChildPool is Initializable, IPool,  PoolSecurityModule {
    using SafeMath for uint256;

    IFxStateChildTunnel public childTunnel;
    IMaticToken public maticToken;
    IERC20 public stMaticToken;
    uint256 public shuttleExpiry;
    uint256 public currentShuttle; 
    uint256 public availableMaticBalance;
    uint256 public availableStMaticBalance;
    
    mapping(uint256 => Shuttle) public shuttles;
    mapping(uint256 => mapping(address => uint256)) public balances;

    function init(
        IFxStateChildTunnel _childTunnel, 
        IMaticToken _maticToken,
        IERC20 _stMaticToken,
        uint256 _shuttleExpiry,
        address _owner
    ) 
        public 
        initializer
     {

         childTunnel = _childTunnel;
         maticToken = _maticToken;
         stMaticToken = _stMaticToken;
         shuttleExpiry = _shuttleExpiry;

         currentShuttle = 0;
         availableMaticBalance = 0;
         availableStMaticBalance = 0;

        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
        _setupRole(OPERATOR_ROLE, _owner);
        _setupRole(CANCEL_ROLE, _owner);
        _setupRole(PAUSE_ROLE, _owner);
        _setupRole(GOVERNANCE_ROLE, _owner);

        createNewShuttle();
    }


     function createNewShuttle() internal {
        currentShuttle = currentShuttle.add(1);
        shuttles[currentShuttle] = Shuttle({
            totalAmount: 0,
            status: ShuttleStatus.AVAILABLE,
            recievedToken: 0,
            expiry: block.number.add(shuttleExpiry)
        });
        emit ShuttleCreated(currentShuttle);
    }




}