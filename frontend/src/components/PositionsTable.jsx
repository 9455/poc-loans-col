import { useState, useMemo } from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Calendar, DollarSign, Activity } from 'lucide-react';

const PROTOCOL_LOGOS = {
    'Uniswap': '/icons/uniswap.png',
    'Aave': '/icons/aave.png',
    'Lido': '/icons/lido.png'
};

const TOKENS = {
    WETH: { icon: '/icons/weth.png', name: 'Wrapped Ether' },
    WBTC: { icon: '/icons/wbtc.png', name: 'Wrapped Bitcoin' },
    ETH: { icon: '/icons/eth.png', name: 'Ethereum' }
};

export default function PositionsTable({ positions }) {
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');

    const sortedPositions = useMemo(() => {
        if (!positions || positions.length === 0) return [];
        
        const sorted = [...positions];
        
        sorted.sort((a, b) => {
            let compareA, compareB;
            
            switch (sortBy) {
                case 'date':
                    compareA = new Date(a.createdAt).getTime();
                    compareB = new Date(b.createdAt).getTime();
                    break;
                case 'value':
                    compareA = a.collateralValueUSD || 0;
                    compareB = b.collateralValueUSD || 0;
                    break;
                case 'dex':
                    compareA = a.protocol || '';
                    compareB = b.protocol || '';
                    break;
                case 'health':
                    compareA = a.healthFactor || 0;
                    compareB = b.healthFactor || 0;
                    break;
                default:
                    return 0;
            }
            
            if (sortOrder === 'asc') {
                return compareA > compareB ? 1 : -1;
            } else {
                return compareA < compareB ? 1 : -1;
            }
        });
        
        return sorted;
    }, [positions, sortBy, sortOrder]);

    const toggleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const getTotalValue = () => {
        if (!positions || positions.length === 0) return 0;
        return positions.reduce((sum, p) => sum + (p.collateralValueUSD || 0), 0);
    };

    if (!positions || positions.length === 0) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No positions found</div>;
    }

    return (
        <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ 
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '16px',
                    padding: '1.5rem 2rem',
                    flex: 1,
                    minWidth: '300px'
                }}>
                    <div style={{ fontSize: '0.875rem', color: '#888', marginBottom: '0.5rem' }}>Total Portfolio Value</div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0 }}>
                        ${getTotalValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span style={{ fontSize: '1rem', color: '#888', marginLeft: '0.5rem' }}>USDC</span>
                    </h2>
                    <div style={{ fontSize: '0.875rem', color: '#888', marginTop: '0.5rem' }}>
                        Across {positions.length} position{positions.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* Sort Controls */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    {[
                        { key: 'date', label: 'Date', icon: Calendar },
                        { key: 'value', label: 'Value', icon: DollarSign },
                        { key: 'dex', label: 'DEX', icon: null },
                        { key: 'health', label: 'Health', icon: Activity }
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => toggleSort(key)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.25rem',
                                background: sortBy === key ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${sortBy === key ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                                borderRadius: '12px',
                                color: sortBy === key ? '#3b82f6' : '#888',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {Icon && <Icon size={16} />}
                            {label}
                            {sortBy === key && (sortOrder === 'asc' ? <TrendingUp size={14} /> : <TrendingDown size={14} />)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Positions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sortedPositions.map((position) => (
                    <PositionRow key={position.id || position._id} position={position} />
                ))}
            </div>
        </div>
    );
}

function PositionRow({ position }) {
    const getHealthColor = (hf) => {
        if (hf >= 1.5) return '#22c55e';
        if (hf >= 1.2) return '#f59e0b';
        return '#ef4444';
    };

    const getHealthStatus = (hf) => {
        if (hf >= 1.5) return 'Healthy';
        if (hf >= 1.2) return 'At Risk';
        return 'Critical';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1.5rem',
            alignItems: 'center',
            transition: 'all 0.3s'
        }}>
            {/* Protocol */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                        <img src={PROTOCOL_LOGOS[position.protocol]} alt={position.protocol} style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                        <img src={TOKENS[position.tokenSymbol]?.icon} alt={position.tokenSymbol} style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #0b0e14' }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: '600' }}>{position.protocol}</div>
                        <div style={{ fontSize: '0.875rem', color: '#888' }}>{position.collateralAmount?.toFixed(4)} {position.tokenSymbol}</div>
                    </div>
                </div>
                <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', fontSize: '0.75rem', color: '#22c55e' }}>
                    Confirmed
                </span>
            </div>

            {/* APY */}
            <div>
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>APY</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#22c55e' }}>{position.apy}</div>
            </div>

            {/* Date */}
            <div>
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>Date</div>
                <div style={{ fontWeight: '600' }}>{formatDate(position.createdAt)}</div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>{new Date(position.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>

            {/* Value */}
            <div>
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>Value</div>
                <div style={{ fontSize: '1.125rem', fontWeight: '700' }}>
                    ${position.collateralValueUSD?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
            </div>

            {/* Health Factor */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>Health Factor</span>
                    <span style={{ fontWeight: '700', color: getHealthColor(position.healthFactor) }}>
                        {position.healthFactor?.toFixed(2)}
                    </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        width: `${Math.min(Math.max((position.healthFactor / 2) * 100, 0), 100)}%`,
                        background: getHealthColor(position.healthFactor),
                        borderRadius: '4px',
                        transition: 'all 0.3s'
                    }} />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: getHealthColor(position.healthFactor), marginTop: '0.25rem', textAlign: 'right' }}>
                    {getHealthStatus(position.healthFactor)}
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a
                    href={`https://sepolia.etherscan.io/tx/${position.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.625rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '10px',
                        color: '#3b82f6',
                        textDecoration: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <ExternalLink size={16} />
                </a>
                <button style={{
                    padding: '0.625rem 1.25rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer'
                }}>
                    Manage
                </button>
            </div>
        </div>
    );
}
