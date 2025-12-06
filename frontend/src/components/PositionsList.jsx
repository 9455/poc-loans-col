import React, { useState } from 'react';
import { ExternalLink, Clock, DollarSign, Calendar, Percent, Layers, ArrowUpDown, TrendingUp, Info } from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import { RepayModal } from './RepayModal';

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

export default function PositionsList({ positions }) {
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    
    // Modal State
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);

    const handleManageClick = (position) => {
        setSelectedPosition(position);
        setIsRepayModalOpen(true);
    };

    const getTotalValue = () => {
        return positions.reduce((sum, p) => sum + (p.collateralValueUSD || 0), 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    // Sorting Logic
    const getSortedPositions = () => {
        if (!positions) return [];
        
        return [...positions].sort((a, b) => {
            let comparison = 0;
            
            switch (sortBy) {
                case 'date':
                    comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    break;
                case 'apy':
                    const apyA = parseFloat(a.apy) || 0;
                    const apyB = parseFloat(b.apy) || 0;
                    comparison = apyB - apyA;
                    break;
                case 'amount':
                    comparison = (b.collateralValueUSD || 0) - (a.collateralValueUSD || 0);
                    break;
                case 'protocol':
                    comparison = a.protocol.localeCompare(b.protocol);
                    break;
            }
            
            return sortOrder === 'asc' ? -comparison : comparison;
        });
    };

    const sortedPositions = getSortedPositions();

    // Toggle sort helper
    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
            {/* Header with sorting */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    {/* Title is in the hero section */}
                </div>
                
                {/* Sorting Controls */}
                {positions && positions.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <button onClick={() => toggleSort('date')} style={{ padding: '0.5rem', borderRadius: '0.375rem', background: sortBy === 'date' ? 'rgba(255, 255, 255, 0.1)' : 'transparent', color: sortBy === 'date' ? '#3b82f6' : '#888', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} title="Sort by Date"><Calendar size={16} /></button>
                        <button onClick={() => toggleSort('amount')} style={{ padding: '0.5rem', borderRadius: '0.375rem', background: sortBy === 'amount' ? 'rgba(255, 255, 255, 0.1)' : 'transparent', color: sortBy === 'amount' ? '#3b82f6' : '#888', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} title="Sort by Value"><DollarSign size={16} /></button>
                        <button onClick={() => toggleSort('apy')} style={{ padding: '0.5rem', borderRadius: '0.375rem', background: sortBy === 'apy' ? 'rgba(255, 255, 255, 0.1)' : 'transparent', color: sortBy === 'apy' ? '#3b82f6' : '#888', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} title="Sort by APY"><Percent size={16} /></button>
                        <button onClick={() => toggleSort('protocol')} style={{ padding: '0.5rem', borderRadius: '0.375rem', background: sortBy === 'protocol' ? 'rgba(255, 255, 255, 0.1)' : 'transparent', color: sortBy === 'protocol' ? '#3b82f6' : '#888', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} title="Sort by Protocol"><Layers size={16} /></button>
                        <div style={{ width: '1px', height: '1rem', background: 'rgba(255, 255, 255, 0.1)', margin: '0 0.25rem' }} />
                        <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} style={{ padding: '0.5rem', color: '#888', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} title={`Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}><ArrowUpDown size={16} style={{ transform: sortOrder === 'asc' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} /></button>
                    </div>
                )}
            </div>

            {/* Portfolio Total Card */}
            {positions && positions.length > 0 && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    position: 'relative'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#888', marginBottom: '0.25rem' }}>
                                <DollarSign size={16} />
                                <span>Total Portfolio Value</span>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fff' }}>
                                ${getTotalValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <span style={{ fontSize: '1rem', color: '#888', marginLeft: '0.5rem', fontWeight: '500' }}>USDC</span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                                Across {positions.length} position{positions.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <div style={{ display: 'none', '@media (min-width: 640px)': { display: 'flex' }, alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#888' }}>
                            <div style={{ height: '3rem', width: '3rem', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrendingUp size={24} style={{ color: '#3b82f6' }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Positions List */}
            <div style={{ display: 'grid', gap: '1rem' }}>
                {sortedPositions.map((tx) => {
                    // Health Factor logic
                    const hf = tx.healthFactor || 0;
                    const hfColor = hf >= 1.5 ? '#22c55e' : (hf >= 1.1 ? '#f59e0b' : '#ef4444');
                    let hfStatus = 'Safe';
                    let hfDesc = 'Your position is well collateralized.';
                    if (hf < 1.5 && hf >= 1.1) {
                        hfStatus = 'At Risk';
                        hfDesc = 'Consider repaying your loan to avoid liquidation.';
                    } else if (hf < 1.1) {
                        hfStatus = 'Critical';
                        hfDesc = 'Liquidation is imminent if value drops further.';
                    }

                    return (
                        <div
                            key={tx.id || tx._id}
                            style={{
                                background: 'rgba(13, 17, 28, 0.7)', 
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '1rem', 
                                padding: '1.25rem 1.5rem',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s ease-in-out'
                            }}
                            className="position-row"
                        >
                            {/* 1. Icon & Main Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '240px' }}>
                                <Tooltip content={`Assets deposited in ${tx.protocol} as collateral.`}>
                                    <div style={{ position: 'relative', height: '3.5rem', width: '3.5rem', cursor: 'help' }}>
                                        <div style={{ 
                                            height: '3.5rem', width: '3.5rem', borderRadius: '50%', 
                                            background: '#2b2f3e', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <img src={PROTOCOL_LOGOS[tx.protocol] || '/icons/dedlyfi.png'} alt={tx.protocol} style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
                                        </div>
                                        <div style={{ 
                                            position: 'absolute', bottom: '-2px', right: '-2px', height: '1.5rem', width: '1.5rem', 
                                            borderRadius: '50%', background: '#000', padding: '2px'
                                        }}>
                                            <img src={TOKEN_ICONS[tx.tokenSymbol] || '/icons/dedlyfi.png'} alt={tx.tokenSymbol} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </div>
                                    </div>
                                </Tooltip>
                                
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Tooltip content="Amount of tokens locked as collateral.">
                                            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', cursor: 'help' }}>
                                                {tx.collateralAmount?.toFixed(4) || '0.00'} {tx.tokenSymbol}
                                            </span>
                                        </Tooltip>
                                        <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '1rem', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)', fontWeight: '600' }}>Confirmed</span>
                                    </div>
                                    <div style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.1rem' }}>
                                        {tx.protocol}
                                    </div>
                                </div>
                            </div>

                            {/* 2. Health Factor (Rich Tooltip, No Title) */}
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Tooltip content={
                                        <div style={{ textAlign: 'left', minWidth: '150px' }}>
                                            <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0', color: hfColor }}>Status: {hfStatus}</p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: '1.4' }}>{hfDesc}</p>
                                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', opacity: 0.8, fontStyle: 'italic' }}>Liquidation occurs below 1.0</p>
                                        </div>
                                    }>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'help' }}>
                                            <Info size={14} color="#6b7280" />
                                            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: hfColor, minWidth: '2.5rem' }}>
                                                {hf.toFixed(2)}
                                            </span>
                                        </div>
                                    </Tooltip>
                                </div>
                                {/* Health Bar */}
                                <Tooltip content={`Safety Buffer: ${((hf-1)*100).toFixed(0)}% above liquidation.`}>
                                    <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden', cursor: 'help' }}>
                                        <div style={{ width: `${Math.min((hf / 2.0) * 100, 100)}%`, height: '100%', backgroundColor: hfColor, transition: 'width 0.5s ease-out' }} />
                                    </div>
                                </Tooltip>
                            </div>

                            {/* 3. Date */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af', fontSize: '0.9rem', minWidth: '160px' }}>
                                <Clock size={16} style={{ color: '#6b7280' }} />
                                <Tooltip content={`Position created on ${new Date(tx.createdAt).toLocaleString()}`}>
                                    <span style={{ cursor: 'help', borderBottom: '1px dotted #4b5563' }}>{tx.createdAt ? formatDate(tx.createdAt) : '--'}</span>
                                </Tooltip>
                            </div>

                            {/* 4. Value */}
                            <div style={{ textAlign: 'right', minWidth: '160px' }}>
                                <Tooltip content="Current market value of collateral (USD).">
                                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', cursor: 'help' }}>
                                        ${tx.collateralValueUSD?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'} <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 'normal' }}>USDC</span>
                                    </div>
                                </Tooltip>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                    {tx.collateralAmount?.toFixed(4)} {tx.tokenSymbol}
                                </div>
                            </div>

                            {/* 5. Actions (Buttons) */}
                            <div style={{ display: 'flex', gap: '0.75rem', marginLeft: '2rem' }}>
                                <Tooltip content="Manage / Repay Loan">
                                    <button 
                                        onClick={() => handleManageClick(tx)}
                                        style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        <ArrowUpDown size={18} />
                                    </button>
                                </Tooltip>
                                
                                <Tooltip content="View Transaction on Etherscan">
                                    <a 
                                        href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        <ExternalLink size={18} />
                                    </a>
                                </Tooltip>
                            </div>

                        </div>
                    );
                })}
            </div>

            <RepayModal 
                position={selectedPosition}
                isOpen={isRepayModalOpen}
                onClose={() => setIsRepayModalOpen(false)}
            />
        </div>
    );
}
