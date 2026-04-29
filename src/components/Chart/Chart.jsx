import React, { useState } from 'react';
import {
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from 'recharts';
import './Chart.css';

const Chart = ({ candles, candles15Min, symbol, trend15Min }) => {
  const [timeframe, setTimeframe] = useState('5min'); // '5min' or '15min'

  // Select candles based on timeframe
  const activeCandles = timeframe === '5min' ? candles : candles15Min;
  
  if (!activeCandles || activeCandles.length === 0) {
    return (
      <div className="chart-wrapper">
        <div className="chart-header">
          <h3>{symbol} - {timeframe === '5min' ? '5 Minute' : '15 Minute'} Chart</h3>
        </div>
        <div className="chart-placeholder">
          <p>No {timeframe} data available</p>
        </div>
      </div>
    );
  }

  const chartData = activeCandles
    .filter(c => c && c.time)
    .sort((a, b) => a.time - b.time)
    .map(c => ({
      ...c,
      timeStr: new Date(c.time * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      color: c.close >= c.open ? '#26a69a' : '#ef5350',
      macdBuy: c.macd > c.macdSignal,
      aboveVWAP: c.close > c.vwap,
      aboveEMA20: c.close > c.ema20,
    }));

  const latest = chartData[chartData.length - 1] || {};
  const prev = chartData[chartData.length - 2] || {};

  // Calculate trend indicators for display
  const priceChange = latest.close - prev.close;
  const isPriceUp = priceChange > 0;
  
  // Detect Higher Highs / Lower Lows (last 5 candles)
  const last5 = chartData.slice(-5);
  let higherHighs = true;
  let higherLows = true;
  let lowerHighs = true;
  let lowerLows = true;
  
  for (let i = 1; i < last5.length; i++) {
    if (last5[i].high <= last5[i-1].high) higherHighs = false;
    if (last5[i].low <= last5[i-1].low) higherLows = false;
    if (last5[i].high >= last5[i-1].high) lowerHighs = false;
    if (last5[i].low >= last5[i-1].low) lowerLows = false;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-time">{data.timeStr}</p>
          <p>O: ₨{data.open?.toFixed(2)} | H: ₨{data.high?.toFixed(2)}</p>
          <p>L: ₨{data.low?.toFixed(2)} | C: ₨{data.close?.toFixed(2)}</p>
          <p>Volume: {data.volume?.toLocaleString()}</p>
          <p>RSI: {data.rsi?.toFixed(2)} | ATR: {data.atr?.toFixed(2)}</p>
          <p>VWAP: ₨{data.vwap?.toFixed(2)}</p>
          <p>MACD: {data.macd?.toFixed(4)}</p>
          {data.ema9 && <p>EMA9: ₨{data.ema9.toFixed(2)}</p>}
          {data.ema20 && <p>EMA20: ₨{data.ema20.toFixed(2)}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-wrapper">
      <div className="chart-header">
        <h3>{symbol} - {timeframe === '5min' ? '5 Minute' : '15 Minute'} Chart</h3>
        <div className="chart-controls">
          {/* Timeframe Toggle */}
          <div className="timeframe-toggle">
            <button 
              className={`tf-btn ${timeframe === '5min' ? 'active' : ''}`}
              onClick={() => setTimeframe('5min')}
            >
              5M
            </button>
            <button 
              className={`tf-btn ${timeframe === '15min' ? 'active' : ''}`}
              onClick={() => setTimeframe('15min')}
            >
              15M
            </button>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#3b82f6' }}></span>
              <span>Price</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#ff9800' }}></span>
              <span>EMA20</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#10b981' }}></span>
              <span>VWAP</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#385263' }}></span>
              <span>Volume</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Signal Summary Bar */}
      <div className="signal-summary">
        <div className={`signal-tag ${latest.aboveVWAP ? 'bullish' : 'bearish'}`}>
          {latest.aboveVWAP ? '▲ Above VWAP' : '▼ Below VWAP'}
        </div>
        <div className={`signal-tag ${latest.aboveEMA20 ? 'bullish' : 'bearish'}`}>
          {latest.aboveEMA20 ? '▲ Above EMA20' : '▼ Below EMA20'}
        </div>
        <div className={`signal-tag ${latest.macdBuy ? 'bullish' : 'bearish'}`}>
          MACD: {latest.macdBuy ? 'Bullish' : 'Bearish'}
        </div>
        <div className={`signal-tag ${latest.rsi < 30 ? 'oversold' : latest.rsi > 70 ? 'overbought' : 'neutral'}`}>
          RSI: {latest.rsi?.toFixed(1)}
        </div>
        <div className="signal-tag">
          ATR: {latest.atr?.toFixed(2)}
        </div>
        {isPriceUp ? (
          <div className="signal-tag bullish">▲ +{priceChange.toFixed(2)}</div>
        ) : (
          <div className="signal-tag bearish">▼ {priceChange.toFixed(2)}</div>
        )}
      </div>
      
      {/* Trend Detection Bar (for 15min timeframe) */}
      {timeframe === '15min' && (
        <div className="trend-detection-bar">
          <div className={`trend-indicator ${higherHighs ? 'active' : ''}`}>
            <span>HH</span>
            <span className="trend-label">Higher Highs</span>
          </div>
          <div className={`trend-indicator ${higherLows ? 'active' : ''}`}>
            <span>HL</span>
            <span className="trend-label">Higher Lows</span>
          </div>
          <div className={`trend-indicator ${lowerHighs ? 'active' : ''}`}>
            <span>LH</span>
            <span className="trend-label">Lower Highs</span>
          </div>
          <div className={`trend-indicator ${lowerLows ? 'active' : ''}`}>
            <span>LL</span>
            <span className="trend-label">Lower Lows</span>
          </div>
          {trend15Min && (
            <div className={`trend-summary ${trend15Min.trend?.toLowerCase()}`}>
              <span>📈 Trend: {trend15Min.trend} ({trend15Min.strength}%)</span>
              <span className="trend-reason">{trend15Min.reason?.substring(0, 40)}...</span>
            </div>
          )}
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
          <XAxis 
            dataKey="timeStr" 
            stroke="#64748b"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            yAxisId="price"
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `₨${value}`}
          />
          <YAxis 
            yAxisId="volume"
            orientation="right"
            stroke="#64748b"
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Price Area */}
          <Area
            type="monotone"
            dataKey="close"
            stroke="#3b82f6"
            fill="#3b82f620"
            yAxisId="price"
            name="Close"
          />
          
          {/* EMA 20 */}
          {activeCandles.some(c => c.ema20) && (
            <Line
              type="monotone"
              dataKey="ema20"
              stroke="#ff9800"
              strokeWidth={2}
              dot={false}
              yAxisId="price"
              name="EMA 20"
            />
          )}
          
          {/* EMA 9 */}
          {activeCandles.some(c => c.ema9) && (
            <Line
              type="monotone"
              dataKey="ema9"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              yAxisId="price"
              name="EMA 9"
            />
          )}
          
          {/* VWAP */}
          {activeCandles.some(c => c.vwap) && (
            <Line
              type="monotone"
              dataKey="vwap"
              stroke="#10b981"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              yAxisId="price"
              name="VWAP"
            />
          )}
          
          {/* Bollinger Bands */}
          {activeCandles.some(c => c.bbUpper) && (
            <>
              <Line
                type="monotone"
                dataKey="bbUpper"
                stroke="#6366f1"
                strokeWidth={1}
                dot={false}
                yAxisId="price"
                name="BB Upper"
              />
              <Line
                type="monotone"
                dataKey="bbLower"
                stroke="#6366f1"
                strokeWidth={1}
                dot={false}
                yAxisId="price"
                name="BB Lower"
              />
            </>
          )}
          
          {/* Volume Bars */}
          <Bar
            dataKey="volume"
            fill="#385263"
            yAxisId="volume"
            name="Volume"
            opacity={0.5}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* MACD Indicator (Bottom Panel) */}
      {activeCandles.some(c => c.macd) && (
        <div className="macd-panel">
          <div className="macd-header">
            <span>MACD (12, 26, 9) - {timeframe}</span>
            <span className={latest.macd > latest.macdSignal ? 'positive' : 'negative'}>
              {latest.macd > latest.macdSignal ? '▲ Bullish' : '▼ Bearish'}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <ComposedChart data={chartData}>
              <XAxis dataKey="timeStr" hide />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="macdHistogram" fill="#6366f1" name="Histogram" />
              <Line type="monotone" dataKey="macd" stroke="#3b82f6" dot={false} name="MACD" />
              <Line type="monotone" dataKey="macdSignal" stroke="#ef4444" dot={false} name="Signal" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* Chart Summary Stats */}
      <div className="chart-summary">
        <div className="summary-item">
          <span>Open</span>
          <span>₨{latest.open?.toFixed(2) || '---'}</span>
        </div>
        <div className="summary-item">
          <span>High</span>
          <span className="positive">₨{latest.high?.toFixed(2) || '---'}</span>
        </div>
        <div className="summary-item">
          <span>Low</span>
          <span className="negative">₨{latest.low?.toFixed(2) || '---'}</span>
        </div>
        <div className="summary-item">
          <span>Close</span>
          <span className={isPriceUp ? 'positive' : 'negative'}>
            ₨{latest.close?.toFixed(2) || '---'}
          </span>
        </div>
        <div className="summary-item">
          <span>Volume</span>
          <span>{latest.volume?.toLocaleString() || '---'}</span>
        </div>
        <div className="summary-item">
          <span>Candles</span>
          <span>{chartData.length}</span>
        </div>
      </div>
    </div>
  );
};

export default Chart;