import React, { useState, useEffect } from 'react';
import { tradingAPI } from '../../services/api';
import './MarketBreadth.css';

const MarketBreadth = () => {
  const [breadth, setBreadth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMarketBreadth();
  }, []);

  const fetchMarketBreadth = async () => {
    try {
      setLoading(true);
      const response = await tradingAPI.scanBullish(); // Use scan endpoint for breadth
      if (response.data.success) {
        setBreadth(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch market breadth:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="market-breadth-loading">
        <div className="spinner-small"></div>
        <span>Loading market breadth...</span>
      </div>
    );
  }

  if (error || !breadth) {
    return (
      <div className="market-breadth-error">
        <span>⚠️ Unable to load market data</span>
      </div>
    );
  }

  const total = breadth.count || 0;
  const bullishCount = breadth.data?.filter(s => s.setup === 'BULLISH' || s.setup === 'STRONG_BULLISH').length || 0;
  const bearishCount = breadth.data?.filter(s => s.setup === 'BEARISH' || s.setup === 'STRONG_BEARISH').length || 0;
  const neutralCount = total - bullishCount - bearishCount;

  const bullishPercent = total > 0 ? (bullishCount / total) * 100 : 0;
  const bearishPercent = total > 0 ? (bearishCount / total) * 100 : 0;

  let marketSentiment = 'NEUTRAL';
  let sentimentColor = '#94a3b8';
  if (bullishPercent > 60) {
    marketSentiment = 'BULLISH';
    sentimentColor = '#10b981';
  } else if (bearishPercent > 60) {
    marketSentiment = 'BEARISH';
    sentimentColor = '#ef4444';
  }

  return (
    <div className="market-breadth">
      <div className="breadth-header">
        <h3>📊 Market Breadth</h3>
        <div className="market-sentiment" style={{ color: sentimentColor }}>
          {marketSentiment} Market
        </div>
      </div>

      <div className="breadth-stats">
        <div className="stat-card bullish">
          <div className="stat-value">{bullishCount}</div>
          <div className="stat-label">Bullish Setups</div>
          <div className="stat-percent">{bullishPercent.toFixed(1)}%</div>
        </div>
        <div className="stat-card neutral">
          <div className="stat-value">{neutralCount}</div>
          <div className="stat-label">Neutral</div>
        </div>
        <div className="stat-card bearish">
          <div className="stat-value">{bearishCount}</div>
          <div className="stat-label">Bearish Setups</div>
          <div className="stat-percent">{bearishPercent.toFixed(1)}%</div>
        </div>
      </div>

      <div className="breadth-bar">
        <div 
          className="breadth-bar-bullish" 
          style={{ width: `${bullishPercent}%` }}
        />
        <div 
          className="breadth-bar-neutral" 
          style={{ width: `${(neutralCount / total) * 100}%` }}
        />
        <div 
          className="breadth-bar-bearish" 
          style={{ width: `${bearishPercent}%` }}
        />
      </div>

      <div className="breadth-total">
        Total Analyzed: {total} stocks
      </div>

      {breadth.data && breadth.data.length > 0 && (
        <div className="breadth-top-movers">
          <h4>Top Bullish Setups</h4>
          <div className="movers-list">
            {breadth.data.slice(0, 5).map((stock, i) => (
              <div key={i} className="mover-item">
                <span className="mover-symbol">{stock.symbol}</span>
                <span className={`mover-score ${stock.setup?.toLowerCase()}`}>
                  {stock.setup}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketBreadth;