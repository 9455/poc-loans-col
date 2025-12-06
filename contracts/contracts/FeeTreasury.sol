// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title FeeTreasury
 * @dev Secure storage for protocol service fees.
 * Implements granular access control, emergency pause, and strict withdrawal patterns.
 * Designed for production use with OpenZeppelin security standards.
 */
contract FeeTreasury is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");

    event FeeReceived(address indexed token, address indexed sender, uint256 amount, string feeType);
    event FundsWithdrawn(address indexed token, address indexed recipient, uint256 amount);

    constructor(address defaultAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ADMIN_ROLE, defaultAdmin);
        _grantRole(WITHDRAWER_ROLE, defaultAdmin);
    }

    /**
     * @dev Simple getter to verify contract identity.
     */
    function isTreasury() external pure returns (bool) {
        return true;
    }

    /**
     * @dev Handle native ETH deposits.
     */
    receive() external payable {
        emit FeeReceived(address(0), msg.sender, msg.value, "NATIVE_DEPOSIT");
    }

    /**
     * @dev Register a fee payment made in ERC20 tokens.
     * Transfers tokens from sender to this contract.
     * Sender must have approved this contract.
     * @param token Address of the ERC20 token
     * @param amount Amount to transfer
     * @param feeType Identifier for the fee (e.g., "LOAN_ORIGINATION", "LOAN_REPAYMENT")
     */
    function depositFee(address token, uint256 amount, string calldata feeType) external nonReentrant whenNotPaused {
        require(token != address(0), "Use native transfer for ETH");
        require(amount > 0, "Amount must be > 0");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit FeeReceived(token, msg.sender, amount, feeType);
    }

    /**
     * @dev Withdraw funds from the treasury.
     * Only callable by accounts with WITHDRAWER_ROLE.
     * @param token Address of token (address(0) for ETH)
     * @param recipient Address to receive funds
     * @param amount Amount to withdraw
     */
    function withdraw(address token, address recipient, uint256 amount) external onlyRole(WITHDRAWER_ROLE) nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");

        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient ETH balance");
            (bool success, ) = payable(recipient).call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(recipient, amount);
        }

        emit FundsWithdrawn(token, recipient, amount);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
