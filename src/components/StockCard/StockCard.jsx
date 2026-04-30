import React from 'react';
import { formatPrice, formatVolume, formatPercent, getColorByChange, getSignalColor, getSignalLabel } from '../../utils/helpers';
import './StockCard.css';

const StockCard = ({ stock, onClick, onAnalyze, loading }) => {
  const changeColor = getColorByChange(stock.changePercent);
  const signalColor = getSignalColor(stock.signal);
  const signalLabel = getSignalLabel(stock.signal);
  const volumeRatio = stock.volumeAvg ? (stock.volume / stock.volumeAvg) * 100 : 100;
  const confidence = stock.confidence?.score || 0;
  const newsImpact = stock.newsImpact;

  const getConfidenceColor = (score) => {
    if (score >= 75) return '#10b981';
    if (score >= 65) return '#22c55e';
    if (score >= 55) return '#84cc16';
    if (score >= 45) return '#eab308';
    if (score >= 35) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="stock-card" onClick={onClick}>
      <div className="card-header">
        <div className="stock-info">
          <h3 className="stock-symbol">{stock.symbol}</h3>
          <span className="stock-price">{formatPrice(stock.price)}</span>
        </div>
        <div className="signal-badge" style={{ background: `${signalColor}20`, borderColor: signalColor, color: signalColor }}>
          {signalLabel}
        </div>
      </div>

      <div className="price-change" style={{ color: changeColor }}>
        <span className="change-value">{formatPercent(stock.changePercent)}</span>
        <span className="change-arrow">{stock.changePercent > 0 ? '▲' : stock.changePercent < 0 ? '▼' : '●'}</span>
      </div>

      {/* Confidence Bar */}
      <div className="confidence-bar">
        <div className="confidence-track">
          <div className="confidence-fill" style={{ width: `${confidence}%`, background: getConfidenceColor(confidence) }} />
        </div>
        <span className="confidence-label" style={{ color: getConfidenceColor(confidence) }}>
          {confidence}% {stock.confidence?.level?.replace('_', ' ') || ''}
        </span>
      </div>

      {/* News Impact Badge */}
      {newsImpact && (
        <div className={`news-badge ${newsImpact.sentiment?.toLowerCase()}`}>
          📰 {newsImpact.sentiment} • {newsImpact.summary || `Impact: ${newsImpact.impactScore > 0 ? '+' : ''}${newsImpact.impactScore}`}
        </div>
      )}

      <div className="card-stats">
        <div className="stat-row">
          <span className="stat-label">OHLC</span>
          <div className="ohlc-values">
            <span>O: {formatPrice(stock.open)}</span>
            <span>H: {formatPrice(stock.high)}</span>
            <span>L: {formatPrice(stock.low)}</span>
            <span>C: {formatPrice(stock.close || stock.price)}</span>
          </div>
        </div>

        <div className="stat-row">
          <span className="stat-label">Volume</span>
          <span className="stat-value">
            {formatVolume(stock.volume)}
            {stock.volumeAvg && (
              <span className="volume-ratio" style={{ color: volumeRatio > 120 ? '#22c55e' : volumeRatio < 80 ? '#ef4444' : '#94a3b8' }}>
                {' '}({volumeRatio.toFixed(0)}%)
              </span>
            )}
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">RSI (14)</span>
          <span className="stat-value" style={{ color: stock.rsi < 30 ? '#22c55e' : stock.rsi > 70 ? '#ef4444' : '#f59e0b' }}>
            {stock.rsi?.toFixed(2) || '---'}
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">EMA 20</span>
          <span className="stat-value">{formatPrice(stock.ema20)}</span>
        </div>

        {/* Trade Recommendation */}
        {stock.tradeRecommendation && (
          <div className="stat-row">
            <span className="stat-label">Recommendation</span>
            <span className="stat-value" style={{ color: stock.tradeRecommendation.action === 'BUY' ? '#22c55e' : stock.tradeRecommendation.action === 'SELL' ? '#ef4444' : '#f59e0b' }}>
              {stock.tradeRecommendation.action} ({stock.tradeRecommendation.priority})
            </span>
          </div>
        )}
      </div>

      <button className="analyze-btn" onClick={(e) => { e.stopPropagation(); onAnalyze(); }} disabled={loading}>
        {loading ? '⏳ Analyzing...' : '🤖 AI Analysis'}
      </button>
    </div>
  );
};

export default StockCard;