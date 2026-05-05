import React, { useState } from 'react';
import { tradingAPI } from '../../services/api';
import StockDetailModal from '../StockDetailModal/StockDetailModal';
import './StockLookup.css';

const StockLookup = () => {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [stock, setStock] = useState(null);
  const [error, setError] = useState(null);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!symbol.trim()) return;
    
    setLoading(true);
    setError(null);
    setStock(null);

    try {
      const res = await tradingAPI.getStockAnalysis(symbol.trim().toUpperCase());
      if (res?.data?.success) {
        setStock(res.data.stock);
      } else {
        setError(res?.data?.error || 'Stock not found');
      }
    } catch (e) {
      setError('Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stock-lookup">
      <form onSubmit={handleLookup} className="lookup-form">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Enter symbol (e.g., FFC, LUCK, MEBL)"
          className="lookup-input"
          autoFocus
        />
        <button type="submit" className="lookup-btn" disabled={loading}>
          {loading ? '⏳' : '🔍'} Analyze
        </button>
      </form>

      {error && <div className="lookup-error">❌ {error}</div>}

      {stock && (
        <StockDetailModal stock={stock} onClose={() => setStock(null)} />
      )}
    </div>
  );
};

export default StockLookup;