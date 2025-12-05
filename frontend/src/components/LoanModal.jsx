import React, { useState, useEffect } from 'react';
import { ShieldCheck, Info, CheckSquare, Square, Activity, HelpCircle } from 'lucide-react';
import { useLoanExecution } from '../hooks/useLoanExecution';
import { TOKENS, PROTOCOL_LOGOS } from '../utils/constants'; 
import { logger } from '../utils/logger';
import { useAccount, useBalance } from 'wagmi';
import { LoadingAnimation } from './LoadingAnimation';
import confetti from 'canvas-confetti';
import { Toaster, toast } from 'sonner';
import CountUp from 'react-countup';
import { Tooltip } from './ui/Tooltip';

// Mock Prices for UX
const PRICES = {
    WETH: 2500,
    WBTC: 65000,
    ETH: 2500
};

const formatCurrency = (value) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatNumber = (value) => 
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(value);

// Confetti Utility
const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };
  
    const randomInRange = (min, max) => Math.random() * (max - min) + min;
  
    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
  
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
  
      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
};

export function LoanModal({ strategy, tokenSymbol, isOpen, onClose }) {
  const { address } = useAccount();
  
  // Safe Access to Token Config
  const tokenConfig = (tokenSymbol && TOKENS[tokenSymbol]) ? TOKENS[tokenSymbol] : null;
  const tokenAddress = tokenConfig ? tokenConfig.address : undefined;

  const { data: balanceData } = useBalance({
      address: address,
      token: tokenAddress,
      query: { enabled: !!tokenAddress } // Safely disable query if no token
  });

  const [collateralAmount, setCollateralAmount] = useState('');
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const { executeLoan, status, errorMessage, txHash, resetStatus } = useLoanExecution();

  // UX Calculations
  const price = (tokenSymbol && PRICES[tokenSymbol]) ? PRICES[tokenSymbol] : 0;
  const numericAmount = parseFloat(collateralAmount) || 0;
  const collateralValue = numericAmount * price;
  const ltv = 0.70; // 70% LTV
  const loanAmount = collateralValue * ltv;
  const platformFee = loanAmount * 0.01;
  const netReceive = loanAmount - platformFee;
  
  // Balance Check Logic
  const hasInsufficientBalance = balanceData && numericAmount > parseFloat(balanceData.formatted);
  const isProcessing = status === 'EXECUTING' || status === 'APPROVING' || status === 'START';

  // Effects
  useEffect(() => {
    if (isOpen) {
        setCollateralAmount('');
        setIsTermsAccepted(false);
        resetStatus();
        logger.info('Loan Modal Opened', { strategy, tokenSymbol });
    }
  }, [isOpen]); // Keep dependencies minimal to reset on open
  
  useEffect(() => {
    if (status === 'SUCCESS') {
        triggerConfetti();
        toast.success("Loan Executed Successfully!", {
            description: "Your USDC has been sent to your wallet.",
            duration: 5000,
        });
    } else if (status === 'ERROR') {
        toast.error("Transaction Failed", {
            description: errorMessage || "Something went wrong.",
            duration: 5000,
        });
    }
  }, [status, errorMessage]);

  const handleSubmit = async () => {
    if (status === 'SUCCESS') {
        onClose();
        return;
    }

    if (!collateralAmount || numericAmount <= 0) return;
    try {
        await executeLoan({ strategy, amount: collateralAmount, tokenSymbol });
    } catch (e) {
        // Handled by hook
    }
  };

  if (!isOpen || !strategy || !tokenConfig) return null;

  return (
    <>
    <Toaster position="top-center" theme="dark" richColors />
    
    {/* Removed onClick listener from overlay to enforce X button closing ONLY */}
    <div className="modal-overlay"> 
      <div className="modal-content animate-pop-in">
        
        {/* HEADER */}
        <div className="modal-header-styled">
           <div className="header-icons">
               <div className="icon-circle protocol-icon-bg">
                   <img src={strategy.logo || PROTOCOL_LOGOS[strategy.protocol]} alt={strategy.protocol} />
               </div>
               <div className="icon-connector"></div>
               <div className="icon-circle token-icon-bg">
                   <img src={tokenConfig.icon} alt={tokenSymbol} />
               </div>
           </div>
           <h2>Borrow against {tokenSymbol}</h2>
           <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
             on {strategy.protocol}
           </p>
           
           {/* Close Button: Only show if NOT processing */}
           {!isProcessing && (
                <button onClick={onClose} className="close-btn-abs">&times;</button>
           )}
        </div>

        <div className="modal-body">
            
            {/* Loading State OR Success State OR Input State */}
            {isProcessing ? (
                <LoadingAnimation 
                   tokenIcon={tokenConfig.icon} 
                   tokenSymbol={tokenSymbol}
                   message={status === 'APPROVING' ? `Approving ${tokenSymbol}...` : 'Executing Loan...'}
                   submessage={status === 'APPROVING' ? 'Please sign the approval in your wallet' : 'Please sign the loan transaction'}
                />
            ) : status === 'SUCCESS' ? (
                 <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div className="icon-circle" style={{ margin: '0 auto 1.5rem auto', borderColor: 'var(--success)', width: '80px', height: '80px' }}>
                        <ShieldCheck size={40} className="text-success" />
                    </div>
                    <h3 className="text-success" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Success!</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Your loan is active. <br/> <strong className="text-white">{formatCurrency(netReceive)} USDC</strong> have been sent to you.
                    </p>
                    <a 
                        href={`https://sepolia.etherscan.io/tx/${txHash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn-secondary"
                        style={{ color: 'var(--primary-blue)', textDecoration: 'none', fontWeight: 'bold' }}
                    >
                        View on Etherscan
                    </a>
                 </div>
            ) : (
                /* Default Input State */
                <>
                <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <label>Amount</label>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Balance: {balanceData ? formatNumber(parseFloat(balanceData.formatted)) : '0.00'} {tokenSymbol}
                        </span>
                    </div>
                    
                    <div className={`input-wrapper ${hasInsufficientBalance ? 'error-border' : ''}`}>
                        <input 
                            type="number" 
                            placeholder="0.00" 
                            value={collateralAmount}
                            onChange={(e) => setCollateralAmount(e.target.value)}
                        />
                        <div className="token-tag">
                            {tokenSymbol}
                        </div>
                    </div>
                    {hasInsufficientBalance && (
                        <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '4px' }}>
                            Insufficient balance
                        </p>
                    )}
                    
                    <div className="apy-info-box">
                        <Activity size={16} className="text-highlight" />
                        <span>Estimated Annual Returns (Cost)</span>
                        <strong className="text-white" style={{ marginLeft: 'auto' }}>
                            {strategy.apy}
                        </strong>
                    </div>
                </div>

                {/* Simulation - ALWAYS Visible Logic */}
                {(loanAmount > 0 || collateralAmount) && (
                    <div className="loan-simulation">
                        <div className="sim-row">
                            <Tooltip content="Loan-to-Value ratio: Percentage of collateral value you are borrowing. Max 70%.">
                                <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                                    Loan to Value (LTV) <HelpCircle size={12} />
                                </span>
                            </Tooltip>
                            <span>70%</span>
                        </div>
                        <div className="sim-row">
                            <Tooltip content="Total USDC you will borrow based on your collateral.">
                                <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                                    Borrow Amount (USDC) <HelpCircle size={12} />
                                </span>
                            </Tooltip>
                            <span className="text-white">
                                <CountUp 
                                    end={loanAmount} 
                                    prefix="$" 
                                    decimals={2} 
                                    separator="," 
                                    duration={1} 
                                />
                            </span>
                        </div>
                        <div className="sim-row">
                            <Tooltip content="1% fee charged by the platform for facilitating the loan.">
                                <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                                    Platform Fee (1%) <HelpCircle size={12} />
                                </span>
                            </Tooltip>
                            <span className="text-error">
                                -<CountUp end={platformFee} prefix="$" decimals={2} separator="," duration={1} />
                            </span>
                        </div>
                        <div className="sim-divider"></div>
                        <div className="sim-row total">
                            <span>You Receive</span>
                            <span className="text-highlight">
                                <CountUp end={netReceive} prefix="$" decimals={2} separator="," duration={1.5} />
                            </span>
                        </div>
                    </div>
                )}

                {/* Signing Info */}
                <div className="signing-info-box">
                    <p className="signing-title">
                        <Info size={14} /> WHAT YOU ARE SIGNING
                    </p>
                    <div className="signing-step">
                        <span className="step-num">1. Approve:</span>
                        <span>Permission to use your {tokenSymbol}.</span>
                    </div>
                    <div className="signing-step">
                        <span className="step-num">2. Execute:</span>
                        <span>Deposit collateral and borrow USDC.</span>
                    </div>
                </div>

                {/* Terms Checkbox */}
                <div 
                    className="terms-checkbox" 
                    onClick={() => setIsTermsAccepted(!isTermsAccepted)}
                >
                    <div style={{ color: isTermsAccepted ? 'var(--primary-blue)' : 'var(--text-secondary)' }}>
                        {isTermsAccepted ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        I agree to the <strong>Terms of Service</strong>.
                    </span>
                </div>
                </>
            )}

            {/* Action Button */}
            <button 
                className="btn-primary full-width"
                disabled={ status !== 'SUCCESS' && (!collateralAmount || numericAmount <= 0 || !isTermsAccepted || hasInsufficientBalance || isProcessing) }
                onClick={handleSubmit}
            >
                {status === 'SUCCESS' ? 'Close' : 'Confirm Borrow'}
            </button>
            
        </div>
      </div>
    </div>
    </>
  );
}
