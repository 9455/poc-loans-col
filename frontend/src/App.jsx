import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { API_URL, TOKENS, PROTOCOL_LOGOS } from './utils/constants';
import { Header } from './components/Header';
import { LoanModal } from './components/LoanModal';
import { logger } from './utils/logger';
import { Tooltip } from './components/ui/Tooltip';
import { HelpCircle } from 'lucide-react';

function Home() {
  const { address, isConnected } = useAccount();
  const [opportunities, setOpportunities] = useState({ WETH: [], WBTC: [] });
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);

  useEffect(() => {
    fetchAllOpportunities();
  }, []);

  useEffect(() => {
    if (isConnected && address) {
        handleLogin(address);
    }
  }, [isConnected, address]);

  const handleLogin = async (userAddress) => {
     try {
        logger.info('Registering user login', { userAddress });
        await fetch(`${API_URL}/users/connect`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ address: userAddress })
        });
     } catch (e) {
        logger.error("Failed to register user", e);
     }
  };

  const fetchAllOpportunities = async () => {
    setLoading(true);
    try {
      const [wethRes, wbtcRes] = await Promise.all([
        fetch(`${API_URL}/opportunities?token=WETH`),
        fetch(`${API_URL}/opportunities?token=WBTC`)
      ]);

      const wethData = await wethRes.json();
      const wbtcData = await wbtcRes.json();

      setOpportunities({
        WETH: wethData.success ? wethData.data : [],
        WBTC: wbtcData.success ? wbtcData.data : []
      });
      logger.info('Opportunities fetched', { countWETH: wethData.data?.length, countWBTC: wbtcData.data?.length });
    } catch (error) {
      logger.error("Failed to fetch opportunities", error);
    } finally {
      setLoading(false);
    }
  };

  const openLoanModal = (strategy, tokenSymbol) => {
    if (!isConnected) {
      alert("Please connect your wallet first via the button in the header.");
      return;
    }
    setSelectedStrategy(strategy);
    setSelectedToken(tokenSymbol);
  };

  return (
    <>
      <header className="hero">
        <h1>Collateral <span className="hero-highlight">Loans</span></h1>
        <p>Deposit BTC or ETH as collateral and instantly borrow USDC. Low rates, transparent fees.</p>
      </header>

      {/* Content */}
      <main>
        {loading ? (
             <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                Loading opportunities...
             </div>
        ) : (
            <>
                {/* WETH Section */}
                <section>
                <h2 className="section-title">Borrow against WETH</h2>
                <div className="cards-grid">
                    {opportunities.WETH.map((opp, idx) => (
                    <StrategyCard 
                        key={`weth-${idx}`} 
                        opp={opp} 
                        token="WETH" 
                        onAction={() => openLoanModal(opp, 'WETH')} 
                    />
                    ))}
                </div>
                </section>

                {/* WBTC Section */}
                <section>
                <h2 className="section-title">Borrow against WBTC</h2>
                <div className="cards-grid">
                    {opportunities.WBTC.map((opp, idx) => (
                    <StrategyCard 
                        key={`wbtc-${idx}`} 
                        opp={opp} 
                        token="WBTC" 
                        onAction={() => openLoanModal(opp, 'WBTC')} 
                        />
                    ))}
                </div>
                </section>
            </>
        )}
      </main>

      <LoanModal 
        strategy={selectedStrategy} 
        tokenSymbol={selectedToken} 
        isOpen={!!selectedStrategy} 
        onClose={() => setSelectedStrategy(null)} 
      />
    </>
  );
}

function StrategyCard({ opp, token, onAction }) {
  const riskClass = opp.risk === 'Low' ? 'risk-low' : 'risk-medium';

  return (
    <div className="card">
      <div className="card-header">
        <div className="protocol-info">
          <div className="protocol-icon-wrapper">
             <img src={opp.logo || PROTOCOL_LOGOS[opp.protocol]} alt={opp.protocol} className="protocol-icon" />
             <img src={TOKENS[token].icon} alt={token} className="token-badge" />
          </div>
          <span className="protocol-name">{opp.protocol}</span>
        </div>
        <Tooltip content={`${opp.risk} risk based on protocol security, liquidity depth, and market volatility.`}>
          <span className={`risk-badge ${riskClass}`} style={{ cursor: 'help', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {opp.risk} Risk <HelpCircle size={12} />
          </span>
        </Tooltip>
      </div>

      <div className="card-stats">
        <div className="stat-group">
          <Tooltip content="Annual interest rate you'll pay on the borrowed USDC. Lower is better.">
            <span className="stat-label" style={{ cursor: 'help', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Borrow Rate <HelpCircle size={10} />
            </span>
          </Tooltip>
          <span className="stat-value text-success">{opp.apy}</span>
        </div>
        <div className="stat-group" style={{ alignItems: 'flex-end' }}>
          <Tooltip content="Total USDC available to borrow from this protocol. Higher liquidity means larger loans possible.">
            <span className="stat-label" style={{ cursor: 'help', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Available Liquidity <HelpCircle size={10} />
            </span>
          </Tooltip>
          <span className="stat-value">{opp.tvl}</span>
        </div>
      </div>

      <button className="btn-stake" onClick={onAction}>
        Borrow USDC
      </button>
    </div>
  );
}

function Positions() {
    return (
        <div className="hero">
            <h1>My <span className="hero-highlight">Positions</span></h1>
            <p style={{ color: 'gray' }}>Your active loans will appear here.</p>
        </div>
    );
}

function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/positions" element={<Positions />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
