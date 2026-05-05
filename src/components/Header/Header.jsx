import React from 'react';
import './Header.css';

const Header = ({ 
  lastUpdate, 
  isConnected, 
  onRefresh, 
  marketStats,
  nextRefresh  // ADD THIS
}) => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-icon">📈</span>
          <div>
            <h1>PSX Intraday Scanner</h1>
            <p className="subtitle">Real-time Pakistan Stock Exchange</p>
          </div>
        </div>
      </div>

      <div className="header-center">
        {marketStats && (
          <div className="market-stats">
            <div className="stat-item">
              <span className="stat-label">Stocks</span>
              <span className="stat-value">{marketStats.activeStocks}/{marketStats.totalStocks}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">▲ Gainers</span>
              <span className="stat-value positive">{marketStats.gainers || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">▼ Losers</span>
              <span className="stat-value negative">{marketStats.losers || 0}</span>
            </div>
          </div>
        )}
      </div>

      <div className="header-right">
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">
            {isConnected ? 'Live PSX Data' : 'Connecting...'}
          </span>
        </div>
        
        <div className="last-update">
  <span className="update-label">Next refresh</span>
<span className="update-time">
  {nextRefresh ? `${nextRefresh}s` : lastUpdate || '--:--:--'}
</span></div>
        <button className="refresh-btn" onClick={onRefresh}>
          <span className="refresh-icon">↻</span>
          Refresh
        </button>
      </div>
    </header>
  );
};

export default Header;