import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { API_URL } from '../utils/constants';
import { logger } from '../utils/logger';
import PositionsList from '../components/PositionsList';

export default function Positions() {
    const { address, isConnected } = useAccount();
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isConnected && address) {
            fetchPositions(); // First load (shows spinner)
            // Refetch every 5 seconds (background, no spinner)
            const interval = setInterval(() => fetchPositions(true), 5000);
            return () => clearInterval(interval);
        } else {
            setLoading(false);
        }
    }, [isConnected, address]);

    const fetchPositions = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const res = await fetch(`${API_URL.replace('/api', '')}/api/loans/positions/${address}`);
            const data = await res.json();
            
            if (data.success) {
                setPositions(data.positions);
                // Only log on initial load to avoid console spam
                if (!isBackground) logger.info('Positions fetched', { count: data.positions.length });
            }
        } catch (error) {
            logger.error('Failed to fetch positions', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isConnected) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>My <span style={{ color: '#3b82f6' }}>Positions</span></h1>
                <p style={{ color: '#888' }}>Please connect your wallet to view your active loans.</p>
            </div>
        );
    }

    return (
        <>
            <header className="hero">
                <h1>My <span className="hero-highlight">Positions</span></h1>
                <p>Track your active stakes and earnings</p>
            </header>

            <main>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                        Loading positions...
                    </div>
                ) : positions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                        <p>No active loans yet.</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
                            Start by borrowing USDC against your WETH or WBTC on the home page.
                        </p>
                    </div>
                ) : (
                    <PositionsList positions={positions} />
                )}
            </main>
        </>
    );
}
