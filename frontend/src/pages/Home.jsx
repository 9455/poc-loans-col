import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { API_URL, TOKENS, PROTOCOL_LOGOS } from '../utils/constants';
import { LoanModal } from '../components/LoanModal';
import { logger } from '../utils/logger';
import { Tooltip } from '../components/ui/Tooltip';
import { HelpCircle } from 'lucide-react';

export default function Home() {
    const { address, isConnected } = useAccount();
    const [opportunities, setOpportunities] = useState({ WETH: [], WBTC: [] });
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [selectedStrategy, setSelectedStrategy] = useState(null);
    const [selectedToken, setSelectedToken] = useState(null);

    useEffect(() => {
        fetchOpportunities();
    }, []);

    const fetchOpportunities = async () => {
        setLoading(true);
        try {
            const [wethRes, wbtcRes] = await Promise.all([
                fetch(`${API_URL}/opportunities?token=WETH`),
                fetch(`${API_URL}/opportunities?token=WBTC`)
            ]);

            const wethData = await wethRes.json();
            const wbtcData = await wbtcRes.json();

            setOpportunities({
                WETH: wethData.data || [],
                WBTC: wbtcData.data || []
            });
        } catch (error) {
            logger.error('Failed to fetch opportunities', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBorrow = (strategy, token) => {
        if (!isConnected) {
            alert('Please connect your wallet first');
            return;
        }
        setSelectedStrategy(strategy);
        setSelectedToken(token);
    };

    const closeModal = () => {
        setSelectedStrategy(null);
        setSelectedToken(null);
    };

    return (
        <>
            <header className="hero">
                <h1>Borrow <span className="hero-highlight">USDC</span> Against Your Crypto</h1>
                <p>Unlock liquidity without selling. Get instant USDC loans using WETH or WBTC as collateral.</p>
            </header>

            <main>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                        Loading opportunities...
                    </div>
                ) : (
                    <>
                        {/* WETH Section */}
                        <section className="token-section" style={{ maxWidth: '1200px', margin: '0 auto 3rem', padding: '0 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <img 
                                        src={TOKENS.WETH.icon} 
                                        alt="WETH" 
                                        style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                                    />
                                    <div>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Wrapped Ether (WETH)</h2>
                                        <p style={{ color: '#888', margin: '0.25rem 0 0' }}>Borrow up to 70% of your WETH value</p>
                                    </div>
                                </div>
                                <Tooltip content="Loan-to-Value ratio: You can borrow up to 70% of your collateral value">
                                    <HelpCircle size={20} style={{ color: '#888', cursor: 'help' }} />
                                </Tooltip>
                            </div>

                            <div className="cards-grid">
                                {opportunities.WETH.map((opp, index) => (
                                    <OpportunityCard
                                        key={index}
                                        opportunity={opp}
                                        token="WETH"
                                        onBorrow={() => handleBorrow(opp, 'WETH')}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* WBTC Section */}
                        <section className="token-section" style={{ maxWidth: '1200px', margin: '0 auto 3rem', padding: '0 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <img 
                                        src={TOKENS.WBTC.icon} 
                                        alt="WBTC" 
                                        style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                                    />
                                    <div>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Wrapped Bitcoin (WBTC)</h2>
                                        <p style={{ color: '#888', margin: '0.25rem 0 0' }}>Borrow up to 70% of your WBTC value</p>
                                    </div>
                                </div>
                                <Tooltip content="Loan-to-Value ratio: You can borrow up to 70% of your collateral value">
                                    <HelpCircle size={20} style={{ color: '#888', cursor: 'help' }} />
                                </Tooltip>
                            </div>

                            <div className="cards-grid">
                                {opportunities.WBTC.map((opp, index) => (
                                    <OpportunityCard
                                        key={index}
                                        opportunity={opp}
                                        token="WBTC"
                                        onBorrow={() => handleBorrow(opp, 'WBTC')}
                                    />
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </main>

            {/* Loan Modal */}
            {selectedStrategy && selectedToken && (
                <LoanModal
                    isOpen={!!selectedStrategy}
                    strategy={selectedStrategy}
                    tokenSymbol={selectedToken}
                    userAddress={address}
                    onClose={closeModal}
                />
            )}
        </>
    );
}

function OpportunityCard({ opportunity, token, onBorrow }) {
    const getRiskColor = (risk) => {
        switch (risk.toLowerCase()) {
            case 'low': return 'var(--success)';
            case 'medium': return 'var(--risk-medium)';
            case 'high': return 'var(--error)';
            default: return 'var(--text-secondary)';
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <div className="protocol-info">
                    <div className="protocol-icon-wrapper">
                        <img src={PROTOCOL_LOGOS[opportunity.protocol]} alt={opportunity.protocol} className="protocol-icon" />
                        <img src={TOKENS[token].icon} alt={token} className="token-badge" />
                    </div>
                    <span className="protocol-name">{opportunity.protocol}</span>
                </div>
                <span className={`risk-badge risk-${opportunity.risk.toLowerCase()}`} style={{ color: getRiskColor(opportunity.risk) }}>
                    {opportunity.risk} Risk
                </span>
            </div>

            <div className="card-stats">
                <div className="stat-group">
                    <span className="stat-label">Interest Rate (APY)</span>
                    <span className="stat-value text-highlight">{opportunity.apy}</span>
                </div>
                <div className="stat-group" style={{ alignItems: 'flex-end' }}>
                    <span className="stat-label">TVL</span>
                    <span className="stat-value">{opportunity.tvl}</span>
                </div>
            </div>

            <div style={{ 
                background: 'rgba(0,0,0,0.2)', 
                borderRadius: '8px', 
                padding: '0.75rem', 
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.85rem'
            }}>
                <span style={{ color: 'var(--text-secondary)' }}>Max LTV</span>
                <span style={{ color: 'var(--success)', fontWeight: '600' }}>70%</span>
            </div>

            <button className="btn-stake" onClick={onBorrow}>
                Borrow USDC
            </button>
        </div>
    );
}
