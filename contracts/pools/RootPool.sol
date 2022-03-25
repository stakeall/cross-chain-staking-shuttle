pragma solidity ^0.8.3;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./IPool.sol";
import {IFxStateChildTunnel} from "./IPool.sol";
import "./PoolSecurityModule.sol";

contract RootPool is IPool, PoolSecurityModule {
    using SafeMath for uint256;

    IFxStateRootTunnel public rootTunnel;
    IWithdrawManagerProxy public withdrawManagerProxy;
    IERC20PredicateBurnOnly public erc20PredicateBurnOnly;
    IDepositManagerProxy public depositManagerProxy;
    address public erc20PredicateProxy;
    IPolidoAdapter public polidoAdapter;
    IERC20 public maticToken;

    /**
     * Initialize the contract and setup roles.
     *
     * @param _rootTunnel - Address of the child tunnel.
     * @param _withdrawManagerProxy - Address of MATIC token on Polygon Mainnet
     * @param _erc20PredicateBurnOnly - Address of stMatic on Polygon Mainnet
     * @param _depositManagerProxy - Expiry of shuttle in blocks
     * @param _erc20PredicateProxy - Address of the owner
     * @param _polidoAdapter - Address of the owner
     * @param _maticToken - Address of the owner
     * @param _owner - Address of the owner
     */
    function init(
        IFxStateRootTunnel _rootTunnel,
        IWithdrawManagerProxy _withdrawManagerProxy,
        IERC20PredicateBurnOnly _erc20PredicateBurnOnly,
        IDepositManagerProxy _depositManagerProxy,
        address _erc20PredicateProxy,
        IPolidoAdapter _polidoAdapter,
        IERC20 _maticToken,
        address _owner
    ) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        rootTunnel = _rootTunnel;
        withdrawManagerProxy = _withdrawManagerProxy;
        erc20PredicateBurnOnly = _erc20PredicateBurnOnly;
        depositManagerProxy = _depositManagerProxy;
        erc20PredicateProxy = _erc20PredicateProxy;
        polidoAdapter = _polidoAdapter;
        maticToken = _maticToken;

        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
        _setupRole(OPERATOR_ROLE, _owner);
        _setupRole(CANCEL_ROLE, _owner);
        _setupRole(PAUSE_ROLE, _owner);
        _setupRole(GOVERNANCE_ROLE, _owner);
    }
}
