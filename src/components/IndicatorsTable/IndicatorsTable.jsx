import React, { useState } from 'react';
import './IndicatorsTable.css';

const IndicatorsTable = ({ stocks, onSelectStock }) => {
  const [sortField, setSortField] = useState('symbol');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterSignal, setFilterSignal] = useState('ALL');

  // Helper: Get latest candle data
  const getLatestCandle = (stock) => {
    if (!stock.candles || stock.candles.length === 0) return {};
    return stock.candles[stock.candles.length - 1];
  };

  // Helper: Enrich stock with latest candle data for display
  const enrichStockWithLatestCandle = (stock) => {
    const latestCandle = getLatestCandle(stock);
    
    return {
      ...stock,
      // Moving Averages - calculate percentage from EMA/VWAP
      pctFromEma9: latestCandle.ema9 ? ((stock.price - latestCandle.ema9) / latestCandle.ema9 * 100) : null,
      pctFromEma20: latestCandle.ema20 ? ((stock.price - latestCandle.ema20) / latestCandle.ema20 * 100) : null,
      pctFromVWAP: latestCandle.vwap ? ((stock.price - latestCandle.vwap) / latestCandle.vwap * 100) : null,
      
      // Momentum
      rsi: latestCandle.rsi,
      rsiSignal: latestCandle.rsiSignal || (latestCandle.rsi < 30 ? 'Oversold' : latestCandle.rsi > 70 ? 'Overbought' : 'Neutral'),
      stochK: latestCandle.stochK,
      stochSignal: latestCandle.stochSignal,
      macdTrend: latestCandle.macdTrend,
      
      // Volume
      volume: latestCandle.volume,
      volumeRatio: latestCandle.volumeRatio ? latestCandle.volumeRatio * 100 : null,
      volumeSignal: latestCandle.volumeSignal,
      
      // Bollinger
      bbPosition: latestCandle.bbPosition,
      bbSignal: latestCandle.bbSignal,
      bbWidth: latestCandle.bbWidth,
      
      // Other useful fields
      ema9: latestCandle.ema9,
      ema20: latestCandle.ema20,
      vwap: latestCandle.vwap,
      macd: latestCandle.macd,
      macdSignal: latestCandle.macdSignal,
      
      // NEW: Confidence Score and 15-min Trend from enriched data
      confidenceScore: stock.confidence?.score || null,
      confidenceLevel: stock.confidence?.level || null,
      confidenceAction: stock.confidence?.action || null,
      trend15Min: stock.trend15Min || latestCandle.trend15Min || 'NEUTRAL',
      trendStrength15Min: stock.trendStrength15Min || latestCandle.trendStrength15Min || 0,
      tradeRecommendation: stock.tradeRecommendation,
      riskLevels: stock.riskLevels,
    };
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '---';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getPercentColor = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '#64748b';
    return value > 0 ? '#22c55e' : value < 0 ? '#ef4444' : '#94a3b8';
  };

  const getSignalClass = (signal) => {
    if (!signal) return 'signal-neutral';
    if (signal === 'BUY' || signal === 'BUY (Conservative)' || signal === 'BUY (Aggressive)') return 'signal-buy';
    if (signal === 'SELL' || signal === 'SELL (Conservative)' || signal === 'SELL (Aggressive)') return 'signal-sell';
    if (signal === 'STRONG_BUY') return 'signal-strong-buy';
    if (signal === 'STRONG_SELL') return 'signal-strong-sell';
    return 'signal-neutral';
  };

  const getConfidenceClass = (score) => {
    if (score === null || score === undefined) return '';
    if (score >= 70) return 'confidence-high';
    if (score >= 50) return 'confidence-medium';
    return 'confidence-low';
  };

  const getConfidenceColor = (score) => {
    if (score === null || score === undefined) return '#64748b';
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#eab308';
    return '#ef4444';
  };

  const getTrendClass = (trend) => {
    if (trend === 'BULLISH') return 'trend-bullish';
    if (trend === 'SLIGHTLY_BULLISH') return 'trend-slightly-bullish';
    if (trend === 'BEARISH') return 'trend-bearish';
    if (trend === 'SLIGHTLY_BEARISH') return 'trend-slightly-bearish';
    return 'trend-neutral';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'BULLISH') return '📈';
    if (trend === 'SLIGHTLY_BULLISH') return '↗️';
    if (trend === 'BEARISH') return '📉';
    if (trend === 'SLIGHTLY_BEARISH') return '↘️';
    return '➡️';
  };

  const getRSIClass = (rsi) => {
    if (rsi === null || rsi === undefined) return '';
    if (rsi < 30) return 'rsi-oversold';
    if (rsi > 70) return 'rsi-overbought';
    return '';
  };

  // Enrich all stocks with latest candle data
  const enrichedStocks = stocks.map(enrichStockWithLatestCandle);

  // Filter and sort stocks
  const filteredStocks = enrichedStocks.filter(stock => {
    if (filterSignal === 'ALL') return true;
    if (filterSignal === 'BUY') return stock.signal?.includes('BUY') || stock.signal?.includes('STRONG_BUY');
    if (filterSignal === 'SELL') return stock.signal?.includes('SELL') || stock.signal?.includes('STRONG_SELL');
    return true;
  });

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (aVal === null || aVal === undefined) aVal = -Infinity;
    if (bVal === null || bVal === undefined) bVal = -Infinity;
    
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const signals = ['ALL', 'BUY', 'SELL'];

  return (
    <div className="indicators-table-container">
      <div className="table-header">
        <h2>📊 Technical Indicators Dashboard</h2>
        <div className="table-controls">
          <div className="signal-filters">
            {signals.map(sig => (
              <button
                key={sig}
                className={`filter-btn ${filterSignal === sig ? 'active' : ''}`}
                onClick={() => setFilterSignal(sig)}
              >
                {sig}
              </button>
            ))}
          </div>
          <span className="stock-count">{filteredStocks.length} Stocks</span>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="indicators-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('symbol')}>
                Symbol {getSortIcon('symbol')}
              </th>
              <th onClick={() => handleSort('price')}>
                Price {getSortIcon('price')}
              </th>
              <th onClick={() => handleSort('signal')}>
                Signal {getSortIcon('signal')}
              </th>
              {/* NEW: Confidence Score Column */}
              <th onClick={() => handleSort('confidenceScore')}>
                Conf {getSortIcon('confidenceScore')}
              </th>
              {/* NEW: 15-min Trend Column */}
              <th onClick={() => handleSort('trend15Min')}>
                15-min Trend {getSortIcon('trend15Min')}
              </th>
              <th colSpan="3" className="section-header">Moving Averages</th>
              <th colSpan="3" className="section-header">Momentum</th>
              <th colSpan="2" className="section-header">Volume</th>
              <th colSpan="2" className="section-header">Bollinger</th>
            </tr>
            <tr>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              {/* MA Section */}
              <th onClick={() => handleSort('pctFromEma9')}>
                EMA9 {getSortIcon('pctFromEma9')}
              </th>
              <th onClick={() => handleSort('pctFromEma20')}>
                EMA20 {getSortIcon('pctFromEma20')}
              </th>
              <th onClick={() => handleSort('pctFromVWAP')}>
                VWAP {getSortIcon('pctFromVWAP')}
              </th>
              {/* Momentum Section */}
              <th onClick={() => handleSort('rsi')}>
                RSI(7) {getSortIcon('rsi')}
              </th>
              <th onClick={() => handleSort('stochK')}>
                Stoch %K {getSortIcon('stochK')}
              </th>
              <th onClick={() => handleSort('macdTrend')}>
                MACD {getSortIcon('macdTrend')}
              </th>
              {/* Volume Section */}
              <th onClick={() => handleSort('volume')}>
                Volume {getSortIcon('volume')}
              </th>
              <th onClick={() => handleSort('volumeRatio')}>
                Vol % {getSortIcon('volumeRatio')}
              </th>
              {/* Bollinger Section */}
              <th onClick={() => handleSort('bbPosition')}>
                BB Pos {getSortIcon('bbPosition')}
              </th>
              <th onClick={() => handleSort('bbSignal')}>
                BB Signal {getSortIcon('bbSignal')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStocks.map(stock => (
              <tr 
                key={stock.symbol} 
                onClick={() => onSelectStock(stock)}
                className="table-row-clickable"
              >
                <td className="symbol-cell">
                  <strong>{stock.symbol}</strong>
                </td>
                <td className="price-cell">
                  ₨{stock.price?.toFixed(2) || '---'}
                </td>
                <td className="signal-cell">
                  <span className={`signal-badge ${getSignalClass(stock.signal)}`}>
                    {stock.signal || 'NEUTRAL'}
                  </span>
                </td>
                
                {/* NEW: Confidence Score Cell */}
                <td className="confidence-cell">
                  {stock.confidenceScore ? (
                    <div className="confidence-container">
                      <div 
                        className="confidence-bar"
                        style={{ 
                          width: `${stock.confidenceScore}%`,
                          backgroundColor: getConfidenceColor(stock.confidenceScore)
                        }}
                      />
                      <span className="confidence-value">
                        {stock.confidenceScore}%
                      </span>
                      {stock.confidenceLevel && (
                        <span className={`confidence-level ${getConfidenceClass(stock.confidenceScore)}`}>
                          {stock.confidenceLevel}
                        </span>
                      )}
                    </div>
                  ) : '---'}
                </td>
                
                {/* NEW: 15-min Trend Cell */}
                <td className={`trend-cell ${getTrendClass(stock.trend15Min)}`}>
                  <span className="trend-icon">{getTrendIcon(stock.trend15Min)}</span>
                  <span className="trend-text">{stock.trend15Min}</span>
                  {stock.trendStrength15Min > 0 && (
                    <span className="trend-strength">({stock.trendStrength15Min}%)</span>
                  )}
                </td>
                
                {/* Moving Averages */}
                <td style={{ color: getPercentColor(stock.pctFromEma9) }}>
                  {formatPercent(stock.pctFromEma9)}
                </td>
                <td style={{ color: getPercentColor(stock.pctFromEma20) }}>
                  {formatPercent(stock.pctFromEma20)}
                </td>
                <td style={{ color: getPercentColor(stock.pctFromVWAP) }}>
                  {formatPercent(stock.pctFromVWAP)}
                </td>
                
                {/* Momentum */}
                <td className={getRSIClass(stock.rsi)}>
                  {stock.rsi?.toFixed(1) || '---'}
                  {stock.rsiSignal && (
                    <span className="indicator-label">{stock.rsiSignal}</span>
                  )}
                </td>
                <td>
                  {stock.stochK?.toFixed(1) || '---'}
                  {stock.stochSignal && (
                    <span className="indicator-label">{stock.stochSignal}</span>
                  )}
                </td>
                <td className={stock.macdTrend === 'Bullish' ? 'bullish' : stock.macdTrend === 'Bearish' ? 'bearish' : ''}>
                  {stock.macdTrend || '---'}
                </td>
                
                {/* Volume */}
                <td>
                  {stock.volume?.toLocaleString() || '---'}
                </td>
                <td className={stock.volumeRatio > 120 ? 'high-volume' : stock.volumeRatio < 80 ? 'low-volume' : ''}>
                  {stock.volumeRatio?.toFixed(0) !== 'NaN' ? `${stock.volumeRatio?.toFixed(0)}%` : '---'}
                  {stock.volumeSignal && (
                    <span className="indicator-label">{stock.volumeSignal}</span>
                  )}
                </td>
                
                {/* Bollinger */}
                <td>
                  {stock.bbPosition?.toFixed(0) !== 'NaN' ? `${stock.bbPosition?.toFixed(0)}%` : '---'}
                  {stock.bbWidth && stock.bbWidth < 3 && <span className="squeeze-badge">SQUEEZE</span>}
                </td>
                <td className={stock.bbSignal === 'Buy' ? 'bullish' : stock.bbSignal === 'Sell' ? 'bearish' : ''}>
                  {stock.bbSignal || '---'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="table-legend">
        <div className="legend-section">
          <h4>Moving Averages</h4>
          <span>% from EMA9/20/VWAP - Green=Above, Red=Below</span>
        </div>
        <div className="legend-section">
          <h4>RSI(7)</h4>
          <span className="rsi-oversold">Oversold &lt;30</span>
          <span className="rsi-overbought">Overbought &gt;70</span>
        </div>
        <div className="legend-section">
          <h4>Volume</h4>
          <span className="high-volume">High &gt;120%</span>
          <span className="low-volume">Low &lt;80%</span>
        </div>
        <div className="legend-section">
          <h4>Confidence Score</h4>
          <span className="confidence-high">High ≥70%</span>
          <span className="confidence-medium">Medium 50-69%</span>
          <span className="confidence-low">Low &lt;50%</span>
        </div>
        <div className="legend-section">
          <h4>15-min Trend</h4>
          <span className="trend-bullish">📈 Bullish</span>
          <span className="trend-bearish">📉 Bearish</span>
          <span className="trend-neutral">➡️ Neutral</span>
        </div>
      </div>
    </div>
  );
};

export default IndicatorsTable;