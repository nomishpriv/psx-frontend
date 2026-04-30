import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import Header from '../Header/Header';
import StockCard from '../StockCard/StockCard';
import Chart from '../Chart/Chart';
import IndicatorsTable from '../IndicatorsTable/IndicatorsTable';
import TopOpportunities from '../TopOpportunities/TopOpportunities';
import MarketBreadth from '../MarketBreadth/MarketBreadth';
import SessionIndicator from '../SessionIndicator/SessionIndicator';
import StockDetailModal from '../StockDetailModal/StockDetailModal';
import { psxAPI, stockAPI, healthAPI, batchAPI, tradingAPI } from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [enrichedStocks, setEnrichedStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [marketStats, setMarketStats] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyData, setCompanyData] = useState({});
  const [viewMode, setViewMode] = useState('cards');
  const [refreshCountdown, setRefreshCountdown] = useState(300);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [topOpportunities, setTopOpportunities] = useState([]);
  const [marketBreadth, setMarketBreadth] = useState(null);
  const [generalNews, setGeneralNews] = useState([]);

  const fetchingRef = useRef(false);
  const intervalRef = useRef(null);

  const checkHealth = useCallback(async () => {
    try {
      const res = await healthAPI.check();
      setIsConnected(res.data.status === 'healthy');
    } catch {
      setIsConnected(false);
    }
  }, []);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setLoading(true);

      // Fetch enriched data
      let enrichedResponse = null;
      try {
        enrichedResponse = await tradingAPI.getEnrichedStocks();
        if (enrichedResponse?.data?.success) {
          setEnrichedStocks(enrichedResponse.data.data);
          setSessionInfo(enrichedResponse.data.session);
        }
      } catch (e) { console.warn('Enriched API failed:', e); }

      // Fetch market breadth
      try {
        const breadth = await tradingAPI.scanBullish();
        if (breadth?.data?.success) setMarketBreadth(breadth.data);
      } catch (e) { console.warn('Market breadth failed:', e); }

      // Fetch general news
      try {
        const newsRes = await tradingAPI.getGeneralNews();
        if (newsRes?.data?.success) setGeneralNews(newsRes.data.data || []);
      } catch (e) { console.warn('News fetch failed:', e); }

      // Fallback legacy data
      const { stocks: stocksRes, overview: overviewRes, companies: companiesRes } = await batchAPI.getAllDataWithFallback();
      if (!stocksRes || !overviewRes || !companiesRes) throw new Error('Failed to fetch required data');

      // Company data map
      const companyDataMap = {};
      if (companiesRes.data.success && companiesRes.data.data) {
        companiesRes.data.data.forEach(c => {
          if (c?.symbol) companyDataMap[c.symbol] = { equity: c.equity || {}, ratios: c.ratios || {}, financials: c.financials || { annual: {}, quarterly: {} }, payouts: c.payouts || [], stats: c.stats || {}, companyName: c.companyName, sector: c.sector };
        });
      }
      setCompanyData(companyDataMap);

      // OHLC map
      const ohlcMap = {};
      if (companiesRes.data.success && companiesRes.data.data) {
        companiesRes.data.data.forEach(c => {
          if (c?.symbol && c.ohlc) ohlcMap[c.symbol] = { open: c.ohlc.open || c.price, high: c.ohlc.high || c.price, low: c.ohlc.low || c.price, close: c.ohlc.close || c.price, dayVolume: c.ohlc.volume || 0 };
        });
      }

      // Merge enriched + legacy
      let processed = [];
      if (stocksRes.data.success) {
        processed = stocksRes.data.data.map(stock => {
          const enriched = enrichedResponse?.data?.data?.find(e => e.symbol === stock.symbol);
          const ohlc = ohlcMap[stock.symbol];
          return {
            ...stock, ...enriched,
            open: ohlc?.open ?? stock.open ?? stock.price,
            high: ohlc?.high ?? stock.high ?? stock.price,
            low: ohlc?.low ?? stock.low ?? stock.price,
            close: ohlc?.close ?? stock.close ?? stock.price,
            dayVolume: ohlc?.dayVolume ?? stock.volume,
            confidence: enriched?.confidence,
            riskLevels: enriched?.riskLevels,
            tradeRecommendation: enriched?.tradeRecommendation,
            currentSession: enriched?.currentSession,
            sessionAdvice: enriched?.sessionAdvice,
            fibonacci: enriched?.fibonacci,
            supportResistance: enriched?.supportResistance,
            newsImpact: enriched?.newsImpact
          };
        });
        setStocks(processed);
        setSelectedStock(prev => prev ? processed.find(s => s.symbol === prev.symbol) || prev : processed[0]);
      }

      // Top opportunities
      try {
        const opps = await tradingAPI.getTopOpportunities(10);
        if (opps?.data?.success) setTopOpportunities(opps.data.data);
      } catch (e) { console.warn('Opportunities failed:', e); }

      if (overviewRes.data.success) {
        setMarketStats({ ...overviewRes.data.data, totalStocks: stocksRes.data.data?.length || 0, activeStocks: stocksRes.data.data?.filter(s => s.price).length || 0, session: sessionInfo });
      }

      setIsConnected(true);
      setLastUpdate(new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setRefreshCountdown(300);
      if (isManualRefresh) toast.success('Data refreshed');
    } catch (error) {
      console.error('Fetch failed:', error);
      setIsConnected(false);
      if (isManualRefresh) toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [sessionInfo]);

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => setRefreshCountdown(prev => prev <= 1 ? 300 : prev - 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Initial fetch + interval
  useEffect(() => {
    checkHealth();
    fetchData(false);
    intervalRef.current = setInterval(() => fetchData(false), 300000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData, checkHealth]);

  const handleManualRefresh = () => fetchData(true);
  const handleStockClick = (stock) => { setSelectedStock(stock); setModalOpen(true); };

  const formatCountdown = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const filteredStocks = stocks.filter(s => s.symbol.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading && stocks.length === 0) {
    return <div className="dashboard-loading"><div className="spinner"></div><p>Loading PSX Data...</p></div>;
  }

  return (
    <div className="dashboard">
      <Toaster position="top-right" theme="dark" />
      <Header lastUpdate={lastUpdate} isConnected={isConnected} onRefresh={handleManualRefresh} marketStats={marketStats} nextRefresh={refreshCountdown} sessionInfo={sessionInfo} topOpportunitiesCount={topOpportunities.length} />

      <div className="dashboard-top-row">
        <SessionIndicator />
        <MarketBreadth />
      </div>

      {/* News Bar */}
      {generalNews.length > 0 && (
        <div className="news-bar">
          <span className="news-bar-title">📰 Market News</span>
          <div className="news-bar-scroll">
            {generalNews.map((n, i) => (
              <span key={i} className={`news-chip ${n.sentiment?.toLowerCase()}`}>
                {n.headline} ({n.sentiment})
              </span>
            ))}
          </div>
        </div>
      )}

      <TopOpportunities onSelectStock={handleStockClick} limit={5} />

      <div className="view-toggle">
        <div className="view-toggle-left">
          <button className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => setViewMode('cards')}>📇 Cards</button>
          <button className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>📊 Table</button>
        </div>
        <span className="countdown-timer">⏱️ Next refresh: {formatCountdown(refreshCountdown)}</span>
      </div>

      <div className="dashboard-content">
        {viewMode === 'cards' ? (
          <>
            <div className="dashboard-left">
              <div className="search-bar">
                <input type="text" placeholder="Search symbol... (e.g., FFC, OGDC)" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
                <span className="search-icon">🔍</span>
              </div>
              <div className="stocks-grid">
                {filteredStocks.length === 0 ? <div className="no-results"><p>No stocks found</p></div> :
                  filteredStocks.map(stock => (
                    <StockCard key={stock.symbol} stock={stock} onClick={() => handleStockClick(stock)} onAnalyze={() => handleStockClick(stock)} loading={false} />
                  ))
                }
              </div>
            </div>
            <div className="dashboard-right">
              {selectedStock && <Chart candles={selectedStock.candles || []} candles15Min={selectedStock.candles15Min || []} symbol={selectedStock.symbol} trend15Min={{ trend: selectedStock.trend15Min, strength: selectedStock.trendStrength15Min, reason: selectedStock.trendReason15Min }} confidence={selectedStock.confidence} riskLevels={selectedStock.riskLevels} />}
            </div>
          </>
        ) : (
          <div className="dashboard-full">
            <div className="search-bar table-search">
              <input type="text" placeholder="Search symbol..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
              <span className="search-icon">🔍</span>
            </div>
            <IndicatorsTable stocks={filteredStocks} onSelectStock={(stock) => { setSelectedStock(stock); setViewMode('cards'); }} />
            {selectedStock && <div className="table-chart"><Chart candles={selectedStock.candles} symbol={selectedStock.symbol} confidence={selectedStock.confidence} /></div>}
          </div>
        )}
      </div>

      <StockDetailModal stock={selectedStock} onClose={() => { setModalOpen(false); setSelectedStock(null); }} />
    </div>
  );
};

export default Dashboard;