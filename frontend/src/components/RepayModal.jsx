import React, { useState, useMemo } from 'react';
import { X, AlertCircle, Wallet, TrendingUp, Clock, ExternalLink, Info, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import CountUp from 'react-countup';
import { useAccount, useBalance } from 'wagmi';
import { API_URL, TOKENS } from '../utils/constants';
import { Tooltip } from './ui/Tooltip';

// Icons Mapping
const PROTOCOL_LOGOS = {
    'Uniswap': '/icons/uniswap.png',
    'Aave': '/icons/aave.png',
    'Lido': '/icons/lido.png'
};

const TOKEN_ICONS = {
    'WETH': '/icons/eth.png',
    'WBTC': '/icons/btc.png',
    'ETH': '/icons/eth.png',
    'USDC': '/icons/dedlyfi.png'
};

export function RepayModal({ position, isOpen, onClose }) {
    const [status, setStatus] = useState('idle');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [hoveredBtn, setHoveredBtn] = useState(false);
    const [hoverCancel, setHoverCancel] = useState(false);

    // Wallet Connection & Balance
    const { address } = useAccount();
    // Fetch USDC Balance (Real)
    const { data: balanceData, isLoading: isLoadingBalance } = useBalance({
        address: address,
        token: TOKENS.USDC?.address, 
        query: {
            enabled: !!address && !!isOpen,
        }
    });

    const walletBalance = balanceData ? parseFloat(balanceData.formatted) : 0.00;

    const [feeRate, setFeeRate] = useState(0);

    // Fetch Fee Config
    React.useEffect(() => {
        const fetchFees = async () => {
            try {
                const res = await fetch(`${API_URL.replace('/api', '')}/api/loans/config/fees`);
                const data = await res.json();
                if (data.success && data.config?.LOAN_REPAYMENT) {
                    setFeeRate(data.config.LOAN_REPAYMENT.percentage / 100);
                }
            } catch (err) {
                console.error('Failed to load fees', err);
            }
        };
        if (isOpen) fetchFees();
    }, [isOpen]);

    // Calculate metrics
    const metrics = useMemo(() => {
        if (!position) return null;

        const apyRate = parseFloat(position.apy.replace('%', '')) / 100;
        const now = new Date();
        const created = new Date(position.createdAt);
        const timeDiffMs = now - created;
        const daysOpen = Math.floor(timeDiffMs / (1000 * 60 * 60 * 24));
        const hoursOpen = Math.floor(timeDiffMs / (1000 * 60 * 60));
        
        const effectiveTime = Math.max(timeDiffMs / (1000 * 60 * 60 * 24 * 365), 1 / (365 * 24)); 
        
        const serviceFeePercent = feeRate; 
        const principal = position.borrowAmount;
        const accruedInterest = principal * apyRate * effectiveTime;
        const serviceFee = principal * serviceFeePercent;
        
        const totalDue = principal + accruedInterest + serviceFee;
        const dailyInterest = (principal * apyRate) / 365;

        return {
            principal,
            accruedInterest,
            serviceFee,
            totalDue,
            dailyInterest,
            daysOpen,
            hoursOpen,
            apy: position.apy,
            collateralAmount: position.collateralAmount,
            collateralValue: position.collateralValueUSD,
            createdDate: created
        };
    }, [position]);

    if (!isOpen || !position || !metrics) return null;

    const hasInsufficientBalance = walletBalance < metrics.totalDue;

    const handleRepay = async (e) => {
        e.preventDefault();

        if (hasInsufficientBalance) {
            toast.error('Insufficient USDC balance in wallet');
            return;
        }

        try {
            setStatus('approving');
            // Simulation of contract interactions
            await new Promise(resolve => setTimeout(resolve, 2000)); 
            
            setStatus('repaying');
            
            const txHash = `0x${Math.random().toString(16).slice(2)}...`;
            
            // Full Repayment API Call
            const res = await fetch(`${API_URL.replace('/api', '')}/api/loans/repay/${position.id || position._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    txHash,
                    amount: metrics.totalDue // Always Full Amount
                })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            setStatus('success');
            
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 10000 });
            toast.success('Repayment Confirmed! Collateral Released.');
            
            setTimeout(() => {
                onClose();
                setStatus('idle');
                setAcceptedTerms(false);
            }, 2500);

        } catch (error) {
            console.error(error);
            toast.error(error.message);
            setStatus('idle');
        }
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            padding: '1rem'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '38rem',
                backgroundColor: '#0b0e14',
                border: '1px solid #2b2f3e',
                borderRadius: '1rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh'
            }}>
                
                {/* Close Button */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', right: '1rem', top: '1rem', padding: '0.5rem',
                            borderRadius: '0.5rem', color: '#9ca3af', background: 'transparent',
                            border: 'none', cursor: 'pointer', zIndex: 10
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '2rem', overflowY: 'auto' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ position: 'relative', height: '4rem', width: '4rem', flexShrink: 0 }}>
                            <div style={{
                                height: '4rem', width: '4rem', borderRadius: '50%', backgroundColor: '#1a1d26',
                                padding: '0.25rem', border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <img src={PROTOCOL_LOGOS[position.protocol] || '/icons/dedlyfi.png'} alt={position.protocol} style={{ width: '2.5rem', height: '2.5rem', objectFit: 'contain' }} />
                            </div>
                            <div style={{
                                position: 'absolute', bottom: '-0.25rem', right: '-0.25rem', height: '1.75rem', width: '1.75rem',
                                borderRadius: '50%', backgroundColor: '#0b0e14', padding: '0.125rem', border: '1px solid #000',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <img src={TOKEN_ICONS[position.tokenSymbol] || '/icons/dedlyfi.png'} alt={position.tokenSymbol} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <span style={{ padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '500', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.2)' }}>Active Loan</span>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', margin: 0 }}>Repay Loan</h2>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>{position.protocol} • {position.tokenSymbol} Collateral</p>
                        </div>
                    </div>

                    {/* Overview Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.05), rgba(168, 85, 247, 0.05))', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        {/* Debt */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <Wallet size={16} color="#9ca3af" />
                                <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Debt</span>
                                <Tooltip content="Principal + Interest needed to close."><Info size={12} color="#4b5563" style={{ cursor: 'help' }} /></Tooltip>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', fontFamily: 'monospace', display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                                $<CountUp end={metrics.totalDue} decimals={2} duration={1} separator="," />
                                <span style={{ fontSize: '0.875rem', color: '#6b7280', fontFamily: 'sans-serif', fontWeight: '400' }}>USDC</span>
                            </div>
                        </div>
                        {/* Collateral */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <TrendingUp size={16} color="#34d399" />
                                <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collateral Locked</span>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#34d399', fontFamily: 'monospace', display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                                <CountUp end={metrics.collateralAmount} decimals={4} duration={1} separator="," />
                                <span style={{ fontSize: '0.875rem', color: 'rgba(52, 211, 153, 0.7)', fontFamily: 'sans-serif', fontWeight: '400' }}>{position.tokenSymbol}</span>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                         <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                                <TrendingUp size={14} color="#ef4444" />
                                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Interest Cost</span>
                                <Tooltip content="Cost of borrowing added to debt."><Info size={12} color="#6b7280" style={{ cursor: 'help' }} /></Tooltip>
                            </div>
                            <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ef4444', fontFamily: 'monospace', margin: 0 }}>+$<CountUp end={metrics.accruedInterest} decimals={4} duration={1} /></p>
                            <p style={{ fontSize: '0.75rem', color: '#ef4444', opacity: 0.8, margin: 0 }}>Total accrued</p>
                        </div>
                        <div style={{ backgroundColor: '#13161f', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                                <Clock size={14} color="#60a5fa" />
                                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Loan Duration</span>
                                <Tooltip content="Time elapsed."><Info size={12} color="#4b5563" style={{ cursor: 'help' }} /></Tooltip>
                            </div>
                            <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', fontFamily: 'monospace', margin: 0 }}>{metrics.daysOpen > 0 ? `${metrics.daysOpen} days` : `${metrics.hoursOpen} hours`}</p>
                            <p style={{ fontSize: '0.75rem', color: '#4b5563', margin: 0 }}>Since creation</p>
                        </div>
                    </div>

                    {/* Repayment Form */}
                    <form onSubmit={handleRepay}>
                        
                        {/* Final Amount & Balance */}
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#e5e7eb' }}>Pay Full Balance</label>
                                <span style={{ 
                                    fontSize: '0.75rem', 
                                    color: hasInsufficientBalance ? '#ef4444' : '#9ca3af',
                                    fontWeight: hasInsufficientBalance ? '600' : '400'
                                }}>
                                    Wallet Balance: {isLoadingBalance ? '...' : walletBalance.toLocaleString('en-US', {minimumFractionDigits: 2})} USDC
                                </span>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={metrics.totalDue.toFixed(6)}
                                    readOnly
                                    style={{
                                        width: '100%',
                                        borderRadius: '0.75rem',
                                        border: hasInsufficientBalance ? '1px solid #ef4444' : '1px solid #2b2f3e',
                                        backgroundColor: '#0d111c',
                                        padding: '0.75rem 1rem',
                                        fontSize: '1.125rem',
                                        color: hasInsufficientBalance ? '#ef4444' : '#fff',
                                        fontFamily: 'monospace',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>USDC</span>
                                </div>
                            </div>
                            {hasInsufficientBalance && (
                                <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.5rem' }}>
                                    You do not have enough USDC to repay this loan.
                                </p>
                            )}
                        </div>

                        {/* Cost Breakdown Details */}
                        <div style={{
                            backgroundColor: '#0d111c',
                            borderRadius: '0.75rem',
                            padding: '1rem',
                            marginBottom: '1rem',
                            border: '1px solid #2b2f3e'
                        }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                    <span>Principal Borrowed</span>
                                    <Tooltip content={`You received ${metrics.principal.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC by collateralizing ${metrics.collateralAmount} ${position.tokenSymbol}.`}><Info size={12} color="#6b7280" style={{ cursor: 'help' }} /></Tooltip>
                                </div>
                                <span style={{ color: '#d1d5db', fontFamily: 'monospace' }}>
                                    {metrics.principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                   <span>+ Accrued Interest</span>
                                   <Tooltip content={`Interest accumulated over time at ${metrics.apy} APY.`}><Info size={12} color="#6b7280" style={{ cursor: 'help' }} /></Tooltip>
                                   <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>({metrics.apy} APY)</span>
                                </div>
                                <span style={{ color: '#ef4444', fontFamily: 'monospace' }}>
                                    {metrics.accruedInterest.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })} USDC
                                </span>
                            </div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                    <span>+ Service Fee</span>
                                    <Tooltip content="Platform fee for processing the repayment (currently 0%)."><Info size={12} color="#6b7280" style={{ cursor: 'help' }} /></Tooltip>
                                </div>
                                <span style={{ color: '#d1d5db', fontFamily: 'monospace' }}>
                                    {metrics.serviceFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                                </span>
                            </div>
                            <div style={{ height: '1px', backgroundColor: '#2b2f3e', margin: '0.5rem 0' }}></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: '600', color: '#fff' }}>
                                <span>Total Repayment</span>
                                <span style={{ fontFamily: 'monospace' }}>
                                    {metrics.totalDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDC
                                </span>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div style={{
                            borderRadius: '0.75rem',
                            backgroundColor: 'rgba(59, 130, 246, 0.05)', // Blue/Info bg
                            padding: '1rem',
                            border: '1px solid rgba(59, 130, 246, 0.1)',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                <AlertCircle size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                                <div>
                                    <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#3b82f6', margin: '0 0 0.25rem 0' }}>Repayment Summary</p>
                                    <ul style={{ fontSize: '0.75rem', color: 'rgba(59, 130, 246, 0.8)', margin: 0, paddingLeft: '1rem', listStyleType: 'disc' }}>
                                        <li>You are paying full Principal + Interest.</li>
                                        <li>Your collateral ({metrics.collateralAmount} {position.tokenSymbol}) will be released to your wallet.</li>
                                        <li>Transaction 1: Approve USDC.</li>
                                        <li>Transaction 2: Repay Loan.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Metadata Footer */}
                        <div style={{ borderRadius: '0.75rem', backgroundColor: '#13161f', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                                <span style={{ color: '#6b7280' }}>Loan TX:</span>
                                <a href={`https://sepolia.etherscan.io/tx/${position.txHash}`} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'monospace', textDecoration: 'none' }}>
                                    {position.txHash?.slice(0, 8)}...{position.txHash?.slice(-6)} <ExternalLink size={12} />
                                </a>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                                <span style={{ color: '#6b7280' }}>Created Date:</span>
                                <span style={{ color: '#d1d5db', fontFamily: 'monospace' }}>{formatDate(metrics.createdDate)}</span>
                            </div>
                        </div>

                        {/* Terms Checkbox */}
                        <div onClick={() => !hasInsufficientBalance && setAcceptedTerms(!acceptedTerms)} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.75rem', cursor: hasInsufficientBalance ? 'not-allowed' : 'pointer', marginBottom: '1.5rem', transition: 'background-color 0.2s', opacity: hasInsufficientBalance ? 0.5 : 1 }}>
                            <div style={{ marginTop: '0.125rem', height: '1rem', width: '1rem', borderRadius: '0.25rem', border: acceptedTerms ? '1px solid #3b82f6' : '1px solid #4b5563', backgroundColor: acceptedTerms ? '#3b82f6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                                {acceptedTerms && <CheckCircle size={12} color="#fff" />}
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0, lineHeight: '1.25' }}>
                                I verify I have sufficient USDC balance and understand that this will close my loan position permanently.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button type="button" onClick={onClose} onMouseEnter={() => setHoverCancel(true)} onMouseLeave={() => setHoverCancel(false)} disabled={status !== 'idle'} style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: hoverCancel ? 'rgba(255,255,255,0.05)' : 'transparent', color: hoverCancel ? '#fff' : '#d1d5db', fontSize: '0.875rem', fontWeight: '500', cursor: status === 'idle' ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>Cancel</button>
                            <button 
                                type="submit" 
                                onMouseEnter={() => setHoveredBtn(true)} 
                                onMouseLeave={() => setHoveredBtn(false)} 
                                disabled={!acceptedTerms || status !== 'idle' || hasInsufficientBalance} 
                                style={{ 
                                    flex: 1, 
                                    padding: '0.75rem 1rem', 
                                    borderRadius: '0.75rem', 
                                    border: (!acceptedTerms || status !== 'idle' || hasInsufficientBalance) ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(34, 197, 94, 0.5)', 
                                    backgroundColor: (!acceptedTerms || status !== 'idle' || hasInsufficientBalance) ? '#1f2937' : (hoveredBtn ? '#16a34a' : '#15803d'), 
                                    background: (!acceptedTerms || status !== 'idle' || hasInsufficientBalance) ? '#1f2937' : 'linear-gradient(to right, #16a34a, #15803d)', 
                                    color: (!acceptedTerms || status !== 'idle' || hasInsufficientBalance) ? '#6b7280' : '#fff', 
                                    fontSize: '0.875rem', fontWeight: '700', 
                                    cursor: (!acceptedTerms || status !== 'idle' || hasInsufficientBalance) ? 'not-allowed' : 'pointer', 
                                    boxShadow: (!acceptedTerms || status !== 'idle' || hasInsufficientBalance) ? 'none' : '0 4px 6px -1px rgba(22, 163, 74, 0.2)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
                                    transition: 'all 0.2s' 
                                }}
                            >
                                {status === 'idle' ? (
                                    <>Confirm Repayment <ArrowRight size={16} /></>
                                ) : (
                                    <><Loader2 className="animate-spin" size={16} /> Processing...</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
