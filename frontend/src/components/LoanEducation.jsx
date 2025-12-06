import React, { useState } from 'react';
import { Info, AlertTriangle, TrendingDown, DollarSign, Percent, Clock, ShieldCheck, Activity } from 'lucide-react';
import './LoanEducation.css';

export function LoanEducation({ 
    collateralAmount, 
    collateralValueUSD, 
    borrowAmount, 
    platformFee, 
    netReceived, 
    apy, 
    protocol,
    tokenSymbol 
}) {
    const [activeTab, setActiveTab] = useState('fees'); // 'fees' | 'risk' | 'projections'

    // Calculate interest examples
    const calculateInterest = (months) => {
        const apyDecimal = parseFloat(apy) / 100;
        const monthlyRate = apyDecimal / 12;
        return borrowAmount * monthlyRate * months;
    };

    const interest1Month = calculateInterest(1);
    const interest6Months = calculateInterest(6);
    const interest1Year = borrowAmount * (parseFloat(apy) / 100);

    // Calculate liquidation price
    const liquidationThreshold = 0.80; // 80%
    const currentPrice = collateralValueUSD / collateralAmount;
    const liquidationPrice = (borrowAmount / (collateralAmount * liquidationThreshold));
    const priceDropPercent = ((currentPrice - liquidationPrice) / currentPrice) * 100;

    const TabButton = ({ id, icon: Icon, label }) => (
        <button 
            onClick={() => setActiveTab(id)}
            style={{
                flex: 1,
                background: activeTab === id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === id ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === id ? '#3b82f6' : '#6b7280',
                padding: '0.75rem 0.5rem',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
            }}
        >
            <Icon size={16} />
            {label}
        </button>
    );

    return (
        <div className="loan-education" style={{ background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', overflow: 'hidden' }}>
            
            {/* Tabs Header */}
            <div style={{ display: 'flex', borderBottom: '1px solid #1e293b' }}>
                <TabButton id="fees" icon={DollarSign} label="Fees & Yield" />
                <TabButton id="risk" icon={AlertTriangle} label="Risk Analysis" />
                <TabButton id="projections" icon={Activity} label="Projections" />
            </div>

            {/* Content Area */}
            <div style={{ padding: '0.75rem', minHeight: '180px' }}> {/* Reduced padding & min-height */}
                
                {/* TAB 1: FEES & OVERVIEW */}
                {activeTab === 'fees' && (
                    <div className="animate-fade-in">
                        <div style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
                            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.1rem' }}>You receive (after fees)</p>
                            <h3 style={{ fontSize: '1.5rem', color: '#22c55e', margin: 0 }}>
                                ${netReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>USDC</span>
                            </h3>
                        </div>

                        <div className="fee-cards" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                            {/* Platform Fee */}
                            <div className="fee-card platform-fee" style={{ padding: '0.75rem', background: '#1e293b', borderRadius: '6px', border: '1px solid #334155' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span style={{ color: '#e2e8f0', fontWeight: '500', fontSize: '0.85rem' }}>Platform Fee (1%)</span>
                                    <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.85rem' }}>-${platformFee.toFixed(2)}</span>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: '1.2' }}>
                                    One-time fee covers execution & security.
                                </div>
                            </div>

                            {/* Loan Summary Mini */}
                            <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                                    <span style={{ color: '#94a3b8' }}>Collateral Locked</span>
                                    <span style={{ color: '#fff' }}>{collateralAmount.toFixed(4)} {tokenSymbol}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                                    <span style={{ color: '#94a3b8' }}>Loan Amount</span>
                                    <span style={{ color: '#fff' }}>${borrowAmount.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0', fontSize: '0.8rem' }}>
                                    <span style={{ color: '#94a3b8' }}>Protocol APY</span>
                                    <span style={{ color: '#f59e0b' }}>{apy}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: RISK ANALYSIS */}
                {activeTab === 'risk' && (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', justifyContent: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Current Price</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }}>${currentPrice.toLocaleString()}</div>
                            </div>
                            <div style={{ color: '#ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <TrendingDown size={20} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>-{priceDropPercent.toFixed(1)}%</span>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Liquidation Price</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444' }}>${liquidationPrice.toLocaleString()}</div>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', color: '#ef4444', fontWeight: '600', fontSize: '0.9rem' }}>
                                <AlertTriangle size={16} /> Liquidation Penalty
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0, lineHeight: '1.4' }}>
                                If price hits <strong>${liquidationPrice.toFixed(2)}</strong>, your collateral is sold with a <strong>5% penalty</strong>. You keep the borrowed USDC together with the penalty.
                            </p>
                        </div>

                        <div className="safety-tips" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div style={{ background: '#1e293b', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <Percent size={14} color="#3b82f6" /> Keep Health Factor {'>'} 1.5
                            </div>
                            <div style={{ background: '#1e293b', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <Clock size={14} color="#3b82f6" /> Repay anytime
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: PROJECTIONS */}
                {activeTab === 'projections' && (
                    <div className="animate-fade-in">
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                <Activity size={16} /> 
                                <span>Interest accrues continuously ({apy})</span>
                            </div>
                            
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {/* 1 Month */}
                                <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '4px', height: '24px', background: '#3b82f6', borderRadius: '2px' }}></div>
                                        <span style={{ color: '#fff' }}>1 Month</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: '#ef4444', fontWeight: '600' }}>+${interest1Month.toFixed(2)}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Interest</div>
                                    </div>
                                </div>

                                {/* 1 Year */}
                                <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '4px', height: '24px', background: '#8b5cf6', borderRadius: '2px' }}></div>
                                        <span style={{ color: '#fff' }}>1 Year</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: '#ef4444', fontWeight: '600' }}>+${interest1Year.toFixed(2)}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Interest</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
                            Estimates based on current APY. Rates are variable and set by the {protocol} protocol.
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
