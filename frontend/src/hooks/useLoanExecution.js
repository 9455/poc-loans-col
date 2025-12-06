import { useState, useCallback } from 'react';
import { useWriteContract, useConfig, useAccount, useReadContract, usePublicClient } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { parseUnits } from 'viem';
import LoanBrokerABI from '../abis/LoanBroker.json';
import { BROKER_ADDRESS, TOKENS } from '../utils/constants';
import { logger } from '../utils/logger';

// ERC20 ABI for Appraisal/Allowance
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
];

export const useLoanExecution = () => {
  const { writeContractAsync } = useWriteContract();
  const config = useConfig();
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();

  const [status, setStatus] = useState('IDLE'); // IDLE, CHECKING, APPROVING, EXECUTING, SUCCESS, ERROR
  const [errorMessage, setErrorMessage] = useState('');
  const [txHash, setTxHash] = useState('');

  // Environment Flag for Mocking (Simulate Liquidity)
  const IS_MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

  const executeLoan = async ({ strategy, amount, tokenSymbol }) => {
    setStatus('START');
    setErrorMessage('');
    
    try {
      if (IS_MOCK_MODE) {
          logger.warn("⚠️ MOCK MODE ENABLED: Simulating loan execution without blockchain interactions.");
          
          // 1. Simulate Check/Approval
          setStatus('CHECKING');
          await new Promise(r => setTimeout(r, 800));
          
          setStatus('APPROVING');
          await new Promise(r => setTimeout(r, 1500)); // Simulate signing
          
          // 2. Simulate Execution
          setStatus('EXECUTING');
          await new Promise(r => setTimeout(r, 2000)); // Simulate mining
          
          const mockHash = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
          setTxHash(mockHash);
          setStatus('SUCCESS');
          logger.info("Mock Loan Executed Successfully", { txHash: mockHash });
          
          // 3. Save position to backend with complete data
          try {
              const tokenConfig = TOKENS[tokenSymbol];
              const amountNum = parseFloat(amount);
              
              // Calculate loan details (70% LTV, 1% fee)
              const MOCK_PRICES = { WETH: 2500, WBTC: 65000, ETH: 2500 };
              const collateralValueUSD = amountNum * MOCK_PRICES[tokenSymbol];
              const loanAmount = collateralValueUSD * 0.70;
              const platformFee = loanAmount * 0.01;
              const netReceived = loanAmount - platformFee;
              
              const response = await fetch(`${import.meta.env.VITE_API_URL.replace('/api', '')}/api/loans/positions`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      userAddress,
                      protocol: strategy.protocol,
                      adapterAddress: strategy.adapter,
                      tokenSymbol,
                      tokenAddress: tokenConfig.address,
                      collateralAmount: amountNum,
                      collateralValueUSD,
                      borrowAmount: loanAmount,
                      platformFee,
                      netReceived,
                      apy: strategy.apy,
                      ltv: 0.70,
                      txHash: mockHash,
                      blockNumber: null, // Mock mode doesn't have real block
                      network: 'sepolia'
                  })
              });
              
              const data = await response.json();
              
              if (!data.success) {
                  throw new Error(data.error || 'Failed to save position');
              }
              
              logger.info("Position saved to backend", { positionId: data.position.id });
          } catch (err) {
              logger.error("Failed to save position", err);
              // Don't throw - position saving failure shouldn't stop the flow
          }
          
          return mockHash;
      }

      const tokenConfig = TOKENS[tokenSymbol];
      if (!tokenConfig) throw new Error("Invalid Token Configuration");

      const amountWei = parseUnits(amount, tokenConfig.decimals);

      logger.info(`Starting loan execution for ${amount} ${tokenSymbol}`, { strategy, amountWei });

      // 1. Check Allowance (Optimized Flow)
      if (tokenSymbol !== 'ETH') {
         setStatus('CHECKING');
         const currentAllowance = await publicClient.readContract({
            address: tokenConfig.address,
            abi: ERC20_ABI,
            functionName: 'allowance',
            args: [userAddress, BROKER_ADDRESS]
         });

         logger.debug('Current Allowance:', { currentAllowance: currentAllowance.toString(), required: amountWei.toString() });

         if (currentAllowance < amountWei) {
             // Need Approval
             setStatus('APPROVING');
             logger.debug('Approving ERC20 token...');
             try {
                const txApprove = await writeContractAsync({
                    address: tokenConfig.address,
                    abi: ERC20_ABI,
                    functionName: 'approve',
                    args: [BROKER_ADDRESS, amountWei],
                });
                logger.info('Approval tx sent', { txApprove });
                
                // Wait for approval receipt
                logger.debug('Waiting for approval receipt...');
                await waitForTransactionReceipt(config, { hash: txApprove });
                logger.info('Approval confirmed on-chain');
             } catch (err) {
                 logger.error('Approval failed', err);
                 // If user rejected, we stop.
                 throw new Error("Token Approval Failed or Rejected");
             }
         } else {
             logger.info('Sufficient allowance exists. Skipping approval.');
         }
      }

      // 2. Execute Loan via Broker
      setStatus('EXECUTING');
      logger.debug('Executing Broker Transaction...');
      
      // TRIGGER SIMULATION FIRST
      // This prevents opening MetaMask if the transaction is doomed to fail (Gas Limit High)
      try {
          logger.debug('Simulating contract execution...');
          
          // Note: Simulate requires 'account' to strictly mimic the user
          await publicClient.simulateContract({
            address: BROKER_ADDRESS,
            abi: LoanBrokerABI.abi,
            functionName: 'executeLoan',
            args: [
              strategy.adapter,
              tokenConfig.address,
              amountWei
            ],
            value: tokenSymbol === 'ETH' ? amountWei : 0n,
            account: userAddress
          });
          logger.info('Simulation successful, proceeding to write.');
      } catch (simError) {
          logger.error('Simulation execution failed', simError);
          // Enhance error message for the user
          let niceMsg = "Unable to execute loan. ";
          
          if (simError.message?.toLowerCase().includes("liquidity")) {
              niceMsg += "The protocol lacks liquidity for this pair.";
          } else {
              niceMsg += "The Smart Contract reverted due to invalid conditions (e.g. Price Feed, Liquidity).";
          }
          
          // Throwing here stops writeContractAsync from triggering MetaMask
          throw new Error(niceMsg);
      }
      
      const hash = await writeContractAsync({
        address: BROKER_ADDRESS,
        abi: LoanBrokerABI.abi,
        functionName: 'executeLoan',
        args: [
          strategy.adapter,
          tokenConfig.address,
          amountWei
        ],
        // No value for ERC20 loans
        value: 0n 
      });

      setTxHash(hash);
      
      // Wait for final confirmation
      logger.debug('Waiting for loan receipt...');
      await waitForTransactionReceipt(config, { hash });
      
      setStatus('SUCCESS');
      logger.info('Loan executed successfully', { hash });
      
      return hash;

    } catch (error) {
      logger.error('Loan execution failed', error);
      setStatus('ERROR');
      
      // Parsing common errors
      let msg = error.shortMessage || error.message || "Transaction failed";
      
      if (msg.includes("gas limit")) {
          msg = "Transaction reverted. Likely insufficient liquidity in pool or invalid conditions.";
      } else if (msg.includes("User rejected")) {
          msg = "User rejected the transaction.";
      }

      setErrorMessage(msg);
      throw error;
    }
  };

  const resetStatus = useCallback(() => {
    setStatus('IDLE');
    setErrorMessage('');
    setTxHash('');
  }, []);

  return {
    executeLoan,
    status,
    errorMessage,
    txHash,
    resetStatus
  };
};
