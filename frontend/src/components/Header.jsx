import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LayoutDashboard, Wallet } from 'lucide-react';

export function Header() {
  const location = useLocation();
  const pathname = location.pathname;

  const isActive = (path) => pathname === path;

  return (
    <header className="header">
      <div className="container navbar" style={{ paddingBottom: 0, marginBottom: 0, borderBottom: 'none' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative', height: '40px', width: '40px' }}>
            <img 
              src="/icons/dedlyfi.png" 
              alt="DedlyFi Logo" 
              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
            />
          </div>
          <span style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            background: 'linear-gradient(to right, #60a5fa, #a855f7)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
            DedlyFi
          </span>
        </Link>

        {/* Navigation Links */}
        <nav style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            background: 'rgba(0,0,0,0.2)', 
            padding: '0.375rem', 
            borderRadius: '0.75rem', 
            border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <Link 
            to="/" 
            className={`nav-link-item ${isActive('/') ? 'active' : ''}`}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s',
                backgroundColor: isActive('/') ? 'var(--primary-blue)' : 'transparent',
                color: isActive('/') ? 'white' : 'var(--text-secondary)',
                boxShadow: isActive('/') ? '0 4px 6px -1px rgba(59, 130, 246, 0.2)' : 'none'
            }}
          >
            <LayoutDashboard size={16} />
            Loans
          </Link>
          <Link 
            to="/positions" 
            className={`nav-link-item ${isActive('/positions') ? 'active' : ''}`}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s',
                backgroundColor: isActive('/positions') ? 'var(--primary-blue)' : 'transparent',
                color: isActive('/positions') ? 'white' : 'var(--text-secondary)',
                boxShadow: isActive('/positions') ? '0 4px 6px -1px rgba(59, 130, 246, 0.2)' : 'none'
            }}
          >
            <Wallet size={16} />
            My Positions
          </Link>
        </nav>

        <ConnectButton 
          showBalance={false}
          accountStatus={{
            smallScreen: 'avatar',
            largeScreen: 'full',
          }}
        />
      </div>
    </header>
  );
}
