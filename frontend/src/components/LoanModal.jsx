import React, { useState, useEffect } from 'react';
import { ShieldCheck, Info, CheckSquare, Square, Activity, ArrowLeft } from 'lucide-react';
import { useLoanExecution } from '../hooks/useLoanExecution';
import { TOKENS, PROTOCOL_LOGOS, API_URL } from '../utils/constants'; 
import { logger } from '../utils/logger';
import { useAccount, useBalance } from 'wagmi';
import { LoadingAnimation } from './LoadingAnimation';
import confetti from 'canvas-confetti';
import { Toaster, toast } from 'sonner';
import { LoanEducation } from './LoanEducation';

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

const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };
    const randomInRange = (min, max) => Math.random() * (max - min) + min;
    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
};

export function LoanModal({ strategy, tokenSymbol, isOpen, onClose }) {
  const { address } = useAccount();
  const tokenConfig = (tokenSymbol && TOKENS[tokenSymbol]) ? TOKENS[tokenSymbol] : null;
  const tokenAddress = tokenConfig ? tokenConfig.address : undefined;

  const { data: balanceData } = useBalance({
      address: address,
      token: tokenAddress,
      query: { enabled: !!tokenAddress }
  });

  const [collateralAmount, setCollateralAmount] = useState('');
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const { executeLoan, status, errorMessage, txHash, resetStatus } = useLoanExecution();
  const [originationFeeRate, setOriginationFeeRate] = useState(0);
  
  // Tab State: 'input' | 'review'
  const [activeTab, setActiveTab] = useState('input');

  // Fetch Fee Config
  useEffect(() => {
      if (isOpen) {
          const fetchFees = async () => {
              try {
                  const safeApiUrl = API_URL || 'http://localhost:3001/api';
                  const baseUrl = safeApiUrl.endsWith('/api') ? safeApiUrl.slice(0, -4) : safeApiUrl;
                  const res = await fetch(`${baseUrl}/api/loans/config/fees`);
                  const data = await res.json();
                  if (data.success && data.config?.LOAN_ORIGINATION) {
                      setOriginationFeeRate(data.config.LOAN_ORIGINATION.percentage / 100);
                  }
              } catch (err) {
                  console.error('Failed to load fees', err);
              }
          };
          fetchFees();
          setCollateralAmount('');
          setIsTermsAccepted(false);
          setActiveTab('input');
          resetStatus();
          logger.info('Loan Modal Opened', { strategy, tokenSymbol });
      }
  }, [isOpen]);

  // UX Calculations
  const price = (tokenSymbol && PRICES[tokenSymbol]) ? PRICES[tokenSymbol] : 0;
  const numericAmount = parseFloat(collateralAmount) || 0;
  const collateralValue = numericAmount * price;
  const ltv = 0.70; // 70% LTV
  const loanAmount = collateralValue * ltv;
  const platformFee = loanAmount * originationFeeRate;
  const netReceive = loanAmount - platformFee;
  
  const hasInsufficientBalance = balanceData && numericAmount > parseFloat(balanceData.formatted);
  const isProcessing = status === 'EXECUTING' || status === 'APPROVING' || status === 'START';

  // Effects
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

  const handleNext = () => {
      if (!collateralAmount || numericAmount <= 0) return;
      setActiveTab('review');
  };

  const handleBack = () => {
      setActiveTab('input');
  };

  const handleSubmit = async () => {
    if (status === 'SUCCESS') {
        onClose();
        return;
    }
    if (!collateralAmount || numericAmount <= 0 || !isTermsAccepted) return;
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
    
    <div className="modal-overlay"> 
      <div className="modal-content animate-pop-in" style={{ maxWidth: '480px' }}> {/* Compact Width */}
        
        {/* HEADER COMPACT */}
        <div className="modal-header-styled" style={{ padding: '1rem 1.5rem', marginBottom: 0 }}>
           <div className="header-icons" style={{ marginBottom: '0.5rem' }}>
               <div className="icon-circle protocol-icon-bg" style={{ width: '32px', height: '32px' }}>
                   <img src={strategy.logo || PROTOCOL_LOGOS[strategy.protocol]} alt={strategy.protocol} style={{ width: '16px' }} />
               </div>
               <div className="icon-connector" style={{ width: '2rem' }}></div>
               <div className="icon-circle token-icon-bg" style={{ width: '32px', height: '32px' }}>
                   <img src={tokenConfig.icon} alt={tokenSymbol} style={{ width: '16px' }} />
               </div>
           </div>
           <h2 style={{ fontSize: '1.25rem', marginBottom: '0.1rem' }}>Borrow {tokenSymbol}</h2>
           <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0' }}>
             on {strategy.protocol}
           </p>
           
           {!isProcessing && (
                <button onClick={onClose} className="close-btn-abs" style={{ top: '1rem', right: '1rem' }}>&times;</button>
           )}
        </div>

        <div className="modal-body" style={{ padding: '1rem 1.5rem' }}>
            
            {/* Loading / Success States */}
            {isProcessing ? (
                <LoadingAnimation 
                   tokenIcon={tokenConfig.icon} 
                   tokenSymbol={tokenSymbol}
                   message={status === 'APPROVING' ? `Approving ${tokenSymbol}...` : 'Executing Loan...'}
                   submessage={status === 'APPROVING' ? 'Please sign the approval in your wallet' : 'Please sign the loan transaction'}
                />
            ) : status === 'SUCCESS' ? (
                 <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div className="icon-circle" style={{ margin: '0 auto 1.5rem auto', borderColor: 'var(--success)', width: '80px', height: '80px' }}>
                        <ShieldCheck size={40} className="text-success" />
                    </div>
                    <h3 className="text-success" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Success!</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Your loan is active. <br/> <strong className="text-white">{formatCurrency(netReceive)} USDC</strong> have been sent.
                    </p>
                    <a 
                        href={`https://sepolia.etherscan.io/tx/${txHash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn-secondary"
                        style={{ display: 'inline-block', width: '100%', color: 'var(--primary-blue)', textDecoration: 'none', fontWeight: 'bold' }}
                    >
                        View on Etherscan
                    </a>
                    <button 
                        className="btn-primary full-width"
                        onClick={onClose}
                        style={{ marginTop: '1rem' }}
                    >
                        Close
                    </button>
                 </div>
            ) : activeTab === 'input' ? (
                /* TAB 1: INPUT configuration */
                <div key="tab-input" className="animate-fade-in">
                    <div className="input-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <label>Collateral Amount</label>
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
                                autoFocus
                            />
                            <div className="token-tag">{tokenSymbol}</div>
                        </div>
                        
                        {/* Price & Value */}
                        {numericAmount > 0 ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <span>{formatCurrency(price)} / {tokenSymbol}</span>
                                <span style={{ color: 'var(--text-white)', fontWeight: '600' }}>≈ {formatCurrency(collateralValue)}</span>
                            </div>
                        ) : <div style={{ height: '1.5rem' }} />}
                        
                        {hasInsufficientBalance && (
                            <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '4px' }}>Insufficient balance</p>
                        )}
                        
                        <div className="apy-info-box" style={{ marginTop: '1rem', padding: '0.75rem' }}>
                            <Activity size={16} className="text-highlight" />
                            <span style={{ fontSize: '0.85rem' }}>Variable Interest Rate</span>
                            <strong className="text-white" style={{ marginLeft: 'auto' }}>{strategy.apy}</strong>
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <button 
                            className="btn-primary full-width"
                            disabled={!collateralAmount || numericAmount <= 0 || hasInsufficientBalance}
                            onClick={handleNext}
                        >
                            Next: Review Loan
                        </button>
                    </div>
                </div>
            ) : (
                /* TAB 2: REVIEW & SIGN */
                <div key="tab-review" className="animate-fade-in">
                    <button 
                        onClick={handleBack} 
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem', padding: 0 }}
                    >
                        <ArrowLeft size={16} /> Back
                    </button>

                    <LoanEducation 
                        collateralAmount={numericAmount}
                        collateralValueUSD={collateralValue}
                        borrowAmount={loanAmount}
                        platformFee={platformFee}
                        netReceived={netReceive}
                        apy={strategy.apy}
                        protocol={strategy.protocol}
                        tokenSymbol={tokenSymbol}
                    />

                    <div className="signing-info-box" style={{ marginTop: '1rem' }}>
                        <p className="signing-title"><Info size={14} /> TRANSACTION STEPS</p>
                        <div className="signing-step">
                            <span className="step-num">1. Check:</span>
                            <span>Review amounts and fees above.</span>
                        </div>
                        <div className="signing-step">
                            <span className="step-num">2. Sign:</span>
                            <span>Approve access and Execute loan in wallet.</span>
                        </div>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="terms-checkbox" onClick={() => setIsTermsAccepted(!isTermsAccepted)}>
                        <div style={{ color: isTermsAccepted ? 'var(--primary-blue)' : 'var(--text-secondary)' }}>
                            {isTermsAccepted ? <CheckSquare size={20} /> : <Square size={20} />}
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            I agree to the <strong>Terms of Service</strong>.
                        </span>
                    </div>

                    <button 
                        className="btn-primary full-width"
                        disabled={!isTermsAccepted}
                        onClick={handleSubmit}
                        style={{ marginTop: '1rem' }}
                    >
                        Confirm Borrow
                    </button>
                </div>
            )}
            
        </div>
      </div>
    </div>
    </>
  );
}
