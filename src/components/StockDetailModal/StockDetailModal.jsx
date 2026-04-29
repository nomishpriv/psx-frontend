import React from 'react';
import ConfidenceGauge from '../ConfidenceGauge/ConfidenceGauge';
import './StockDetailModal.css';

const StockDetailModal = ({ stock, onClose }) => {
  if (!stock) return null;

  const confidence = stock.confidence || {};
  const riskLevels = stock.riskLevels || {};
  const fibonacci = stock.fibonacci || {};
  const supportResistance = stock.supportResistance || {};
  const tradeRecommendation = stock.tradeRecommendation || {};

  const formatNumber = (num) => {
    if (!num) return '---';
    return typeof num === 'number' ? num.toFixed(2) : num;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{stock.symbol}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Price and Signal */}
          <div className="price-section">
            <div className="current-price">₨{formatNumber(stock.price)}</div>
            <div className={`signal-badge ${stock.signal?.includes('BUY') ? 'signal-buy' : stock.signal?.includes('SELL') ? 'signal-sell' : 'signal-neutral'}`}>
              {stock.signal || 'NEUTRAL'}
            </div>
          </div>

          {/* Confidence Score */}
          <div className="confidence-section">
            <h3>Confidence Score</h3>
            <div className="confidence-display">
              <ConfidenceGauge score={confidence.score || 50} size="large" />
              <div className="confidence-details">
                <p className={`confidence-level ${confidence.level?.toLowerCase()}`}>
                  {confidence.level || 'MEDIUM'} Confidence
                </p>
                <p className="confidence-action">{confidence.action || 'MONITOR'}</p>
                {confidence.recommendation && (
                  <p className="confidence-recommendation">{confidence.recommendation}</p>
                )}
              </div>
            </div>
          </div>

          {/* Risk Management */}
          <div className="risk-section">
            <h3>📊 Risk Management</h3>
            <div className="risk-grid">
              <div className="risk-item">
                <span className="risk-label">Stop Loss</span>
                <span className="risk-value stop-loss">{riskLevels.stopLoss?.normal || '---'}</span>
              </div>
              <div className="risk-item">
                <span className="risk-label">Take Profit 1</span>
                <span className="risk-value take-profit">{riskLevels.takeProfit?.tp1 || '---'}</span>
              </div>
              <div className="risk-item">
                <span className="risk-label">Take Profit 2</span>
                <span className="risk-value take-profit">{riskLevels.takeProfit?.tp2 || '---'}</span>
              </div>
              <div className="risk-item">
                <span className="risk-label">Risk/Reward</span>
                <span className="risk-value">{riskLevels.riskReward?.tp1 || '---'}</span>
              </div>
              <div className="risk-item">
                <span className="risk-label">ATR</span>
                <span className="risk-value">₨{formatNumber(stock.atr)}</span>
              </div>
              <div className="risk-item">
                <span className="risk-label">ATR %</span>
                <span className="risk-value">{formatNumber(stock.atrPercent)}%</span>
              </div>
            </div>
          </div>

          {/* Fibonacci Levels */}
          {(fibonacci.retracement || fibonacci.swingHigh) && (
            <div className="fibonacci-section">
              <h3>📐 Fibonacci Retracement</h3>
              <div className="fibonacci-grid">
                <div className="fib-item">
                  <span className="fib-label">Swing High</span>
                  <span className="fib-value">₨{formatNumber(fibonacci.swingHigh)}</span>
                </div>
                <div className="fib-item">
                  <span className="fib-label">23.6%</span>
                  <span className="fib-value">₨{formatNumber(fibonacci.retracement?.level236)}</span>
                </div>
                <div className="fib-item">
                  <span className="fib-label">38.2%</span>
                  <span className="fib-value">₨{formatNumber(fibonacci.retracement?.level382)}</span>
                </div>
                <div className="fib-item">
                  <span className="fib-label">50%</span>
                  <span className="fib-value">₨{formatNumber(fibonacci.retracement?.level500)}</span>
                </div>
                <div className="fib-item">
                  <span className="fib-label">61.8%</span>
                  <span className="fib-value">₨{formatNumber(fibonacci.retracement?.level618)}</span>
                </div>
                <div className="fib-item">
                  <span className="fib-label">Swing Low</span>
                  <span className="fib-value">₨{formatNumber(fibonacci.swingLow)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Support & Resistance */}
          {(supportResistance.supports?.length > 0 || supportResistance.resistances?.length > 0) && (
            <div className="sr-section">
              <h3>📊 Support & Resistance</h3>
              <div className="sr-grid">
                <div className="sr-column">
                  <h4>Supports</h4>
                  {supportResistance.supports?.slice(0, 3).map((s, i) => (
                    <div key={i} className="sr-item">
                      <span className="sr-level">₨{s.level}</span>
                      <span className="sr-strength">Strength: {s.strength}</span>
                    </div>
                  ))}
                </div>
                <div className="sr-column">
                  <h4>Resistances</h4>
                  {supportResistance.resistances?.slice(0, 3).map((r, i) => (
                    <div key={i} className="sr-item">
                      <span className="sr-level">₨{r.level}</span>
                      <span className="sr-strength">Strength: {r.strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Technical Indicators */}
          <div className="indicators-section">
            <h3>📈 Technical Indicators</h3>
            <div className="indicators-grid">
              <div className="indicator-item">
                <span className="indicator-label">RSI (7)</span>
                <span className={`indicator-value ${stock.rsi < 30 ? 'oversold' : stock.rsi > 70 ? 'overbought' : ''}`}>
                  {formatNumber(stock.rsi)}
                </span>
              </div>
              <div className="indicator-item">
                <span className="indicator-label">MACD</span>
                <span className={`indicator-value ${stock.macdTrend === 'Bullish' ? 'bullish' : 'bearish'}`}>
                  {stock.macdTrend || '---'}
                </span>
              </div>
              <div className="indicator-item">
                <span className="indicator-label">Volume Ratio</span>
                <span className={`indicator-value ${stock.volumeRatio > 120 ? 'high-volume' : stock.volumeRatio < 80 ? 'low-volume' : ''}`}>
                  {formatNumber(stock.volumeRatio)}%
                </span>
              </div>
              <div className="indicator-item">
                <span className="indicator-label">BB Position</span>
                <span className="indicator-value">{formatNumber(stock.bbPosition)}%</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-label">VWAP</span>
                <span className={`indicator-value ${stock.vwapSignal === 'Bullish' ? 'bullish' : 'bearish'}`}>
                  {stock.vwapSignal || '---'}
                </span>
              </div>
              <div className="indicator-item">
                <span className="indicator-label">ADX</span>
                <span className="indicator-value">{formatNumber(stock.adx)}</span>
              </div>
            </div>
          </div>

          {/* 15-Min Trend */}
          {stock.trend15Min && (
            <div className="trend-section">
              <h3>⏱️ 15-Minute Trend</h3>
              <div className={`trend-badge-large ${stock.trend15Min.toLowerCase()}`}>
                {stock.trend15Min} ({stock.trendStrength15Min}%)
              </div>
              {stock.trendReason15Min && (
                <p className="trend-reason">{stock.trendReason15Min}</p>
              )}
              {stock.entrySignal15Min && (
                <div className="signal-entry">{stock.entrySignal15Min}</div>
              )}
              {stock.exitSignal15Min && (
                <div className="signal-exit">{stock.exitSignal15Min}</div>
              )}
            </div>
          )}

          {/* Trade Recommendation */}
          {tradeRecommendation.action && (
            <div className="recommendation-section">
              <h3>💡 Trade Recommendation</h3>
              <div className={`recommendation-card ${tradeRecommendation.action?.toLowerCase()}`}>
                <div className="rec-action">{tradeRecommendation.action}</div>
                <div className="rec-reason">{tradeRecommendation.reason}</div>
                <div className="rec-priority">Priority: {tradeRecommendation.priority}</div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default StockDetailModal;