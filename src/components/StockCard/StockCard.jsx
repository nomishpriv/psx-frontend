import React from 'react';
import { 
  formatPrice, 
  formatVolume, 
  formatPercent,
  getColorByChange,
  getSignalColor,
  getSignalLabel 
} from '../../utils/helpers';
import './StockCard.css';

const StockCard = ({ stock, onClick, onAnalyze, loading }) => {
  const changeColor = getColorByChange(stock.changePercent);
  const signalColor = getSignalColor(stock.signal);
  const signalLabel = getSignalLabel(stock.signal);
  
  const volumeRatio = stock.volumeAvg ? 
    (stock.volume / stock.volumeAvg) * 100 : 100;
  
  return (
    <div className="stock-card" onClick={onClick}>
      <div className="card-header">
        <div className="stock-info">
          <h3 className="stock-symbol">{stock.symbol}</h3>
          <span className="stock-price">{formatPrice(stock.price)}</span>
        </div>
        <div 
          className="signal-badge"
          style={{ 
            background: `${signalColor}20`,
            borderColor: signalColor,
            color: signalColor 
          }}
        >
          {signalLabel}
        </div>
      </div>

      <div className="price-change" style={{ color: changeColor }}>
        <span className="change-value">{formatPercent(stock.changePercent)}</span>
        <span className="change-arrow">
          {stock.changePercent > 0 ? '▲' : stock.changePercent < 0 ? '▼' : '●'}
        </span>
      </div>

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
              <span className="volume-ratio" style={{
                color: volumeRatio > 120 ? '#22c55e' : volumeRatio < 80 ? '#ef4444' : '#94a3b8'
              }}>
                {' '}({volumeRatio.toFixed(0)}%)
              </span>
            )}
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">RSI (14)</span>
          <span className="stat-value" style={{
            color: stock.rsi < 30 ? '#22c55e' : stock.rsi > 70 ? '#ef4444' : '#f59e0b'
          }}>
            {stock.rsi?.toFixed(2) || '---'}
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">EMA 20</span>
          <span className="stat-value">
            {formatPrice(stock.ema20)}
          </span>
        </div>
      </div>

      <button 
        className="analyze-btn"
        onClick={(e) => {
          e.stopPropagation();
          onAnalyze();
        }}
        disabled={loading}
      >
        {loading ? '⏳ Analyzing...' : '🤖 AI Analysis'}
      </button>
    </div>
  );
};

export default StockCard;