import React, { useState, useEffect } from 'react';
import { tradingAPI } from '../../services/api';
import ConfidenceGauge from '../ConfidenceGauge/ConfidenceGauge';
import './TopOpportunities.css';

const TopOpportunities = ({ onSelectStock, limit = 5 }) => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOpportunities();
  }, [limit]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await tradingAPI.getTopOpportunities(limit);
      if (response.data.success) {
        setOpportunities(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch opportunities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionClass = (action) => {
    if (action === 'BUY' || action === 'STRONG_BUY') return 'action-buy';
    if (action === 'SELL' || action === 'STRONG_SELL') return 'action-sell';
    if (action === 'ACCUMULATE') return 'action-accumulate';
    if (action === 'REDUCE') return 'action-reduce';
    return 'action-neutral';
  };

  const getActionIcon = (action) => {
    if (action === 'BUY' || action === 'STRONG_BUY') return '📈';
    if (action === 'SELL' || action === 'STRONG_SELL') return '📉';
    if (action === 'ACCUMULATE') return '💰';
    if (action === 'REDUCE') return '⚠️';
    return '⏸️';
  };

  if (loading) {
    return (
      <div className="top-opportunities-loading">
        <div className="spinner-small"></div>
        <span>Loading opportunities...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="top-opportunities-error">
        <span>⚠️ Failed to load opportunities</span>
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="top-opportunities-empty">
        <span>📭 No high-confidence opportunities at the moment</span>
      </div>
    );
  }

  return (
    <div className="top-opportunities">
      <div className="top-opportunities-header">
        <h3>🎯 Top Trading Opportunities</h3>
        <span className="opportunities-count">{opportunities.length} opportunities</span>
      </div>
      <div className="opportunities-list">
        {opportunities.map((opp, index) => (
          <div
            key={opp.symbol}
            className="opportunity-card"
            onClick={() => onSelectStock && onSelectStock({ symbol: opp.symbol })}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="opportunity-rank">#{index + 1}</div>
            <div className="opportunity-main">
              <div className="opportunity-symbol">{opp.symbol}</div>
              <div className="opportunity-price">
                ₨{opp.price?.toFixed(2) || '---'}
                <span className={`price-change ${opp.changePercent > 0 ? 'positive' : opp.changePercent < 0 ? 'negative' : ''}`}>
                  {opp.changePercent > 0 ? '+' : ''}{opp.changePercent?.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="opportunity-confidence">
              <ConfidenceGauge score={opp.confidence} size="small" showLabel={false} />
              <span className={`confidence-score ${opp.confidenceLevel?.toLowerCase()}`}>
                {opp.confidence}%
              </span>
            </div>
            <div className={`opportunity-action ${getActionClass(opp.action)}`}>
              <span className="action-icon">{getActionIcon(opp.action)}</span>
              <span className="action-text">{opp.action || opp.tradeRecommendation?.action || 'HOLD'}</span>
            </div>
            {opp.riskReward && (
              <div className="opportunity-rr">
                <span className="rr-label">Risk/Reward</span>
                <span className="rr-value">{opp.riskReward}</span>
              </div>
            )}
            {/* News Impact Badge */}
            {opp.newsImpact && (
              <div className="opportunity-news">
                📰 {opp.newsImpact}
              </div>
            )}
            {opp.tradeRecommendation?.reason && (
              <div className="opportunity-reason">
                {opp.tradeRecommendation.reason.substring(0, 60)}...
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopOpportunities;