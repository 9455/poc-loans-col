// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IAdapter {
    function execute(address token, uint256 amount) external payable returns (uint256);
}

contract LoanBroker is Ownable {
    using SafeERC20 for IERC20;

    event LoanExecuted(
        address indexed user,
        address indexed adapter,
        address indexed token,
        uint256 amount,
        uint256 fee
    );

    address public feeCollector;
    uint256 public constant FEE_BPS = 100; // 1% = 100 bps

    constructor(address _feeCollector) Ownable(msg.sender) {
        feeCollector = _feeCollector;
    }

    function setFeeCollector(address _feeCollector) external onlyOwner {
        feeCollector = _feeCollector;
    }

    /**
     * @notice Executes a loan via a specific adapter
     * @param adapter The address of the adapter (Aave, Uniswap, etc)
     * @param token The token to use as collateral (address(0) for ETH)
     * @param amount The amount of tokens (or ETH) to use
     */
    function executeLoan(
        address adapter,
        address token,
        uint256 amount
    ) external payable {
        if (token == address(0)) {
            // Native ETH
            require(msg.value == amount, "Incorrect ETH amount");
            
            uint256 fee = (amount * FEE_BPS) / 10000;
            uint256 amountAfterFee = amount - fee;

            // Send fee to collector
            (bool feeSuccess, ) = feeCollector.call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");

            // Execute adapter
            IAdapter(adapter).execute{value: amountAfterFee}(token, amountAfterFee);
        } else {
            // ERC20 (WBTC, USDC, etc)
            uint256 fee = (amount * FEE_BPS) / 10000;
            uint256 amountAfterFee = amount - fee;

            // Transfer from user
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

            // Transfer fee
            IERC20(token).safeTransfer(feeCollector, fee);

            // Approve adapter
            IERC20(token).forceApprove(adapter, amountAfterFee);

            // Execute adapter
            IAdapter(adapter).execute(token, amountAfterFee);
        }

        emit LoanExecuted(msg.sender, adapter, token, amount, FEE_BPS);
    }

    // Function to withdraw stuck funds just in case
    function emergencyWithdraw(address token) external onlyOwner {
        if (token == address(0)) {
            payable(msg.sender).transfer(address(this).balance);
        } else {
            IERC20(token).safeTransfer(msg.sender, IERC20(token).balanceOf(address(this)));
        }
    }
}
