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
import StockLookup from '../StockLookup/StockLookup';
import { psxAPI, stockAPI, healthAPI, batchAPI, tradingAPI } from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [enrichedStocks, setEnrichedStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(false);
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
  const [marketNews, setMarketNews] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [marketVolume, setMarketVolume] = useState(null);
  const [kseVolume, setKseVolume] = useState(null);


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

  const sessionRef = useRef(null);

const fetchData = useCallback(async (isManualRefresh = false) => {
  if (fetchingRef.current) return;
  fetchingRef.current = true;

  try {
    if (isManualRefresh) setLoading(true);

    // Fetch enriched data
    let enrichedResponse = null;
    try {
      enrichedResponse = await tradingAPI.getEnrichedStocks();
      if (enrichedResponse?.data?.success) {
        setEnrichedStocks(enrichedResponse.data.data);
        sessionRef.current = enrichedResponse.data.session;
        setSessionInfo(enrichedResponse.data.session);
      }
    } catch (e) { console.warn('Enriched API failed:', e); }

    // Parallel fetches (news, volume, geo, kse100)
    try {
      const [breadthRes, kseRes, volRes, geoRes, newsRes] = await Promise.allSettled([
        tradingAPI.scanBullish(),
        tradingAPI.getKSE100Volume(),
        tradingAPI.getMarketVolume(),
        tradingAPI.getGeopolitical(),
        tradingAPI.getMarketNews()
      ]);

      if (breadthRes.value?.data?.success) setMarketBreadth(breadthRes.value.data);
      if (kseRes.value?.data) setKseVolume(kseRes.value.data);
      if (volRes.value?.data) setMarketVolume(volRes.value.data);
      if (geoRes.value?.data?.success) setGeoData(geoRes.value.data);
      if (newsRes.value?.data?.success) setMarketNews(newsRes.value.data);
    } catch (e) {}

    // Legacy data
    const { stocks: stocksRes, overview: overviewRes, companies: companiesRes } = await batchAPI.getAllDataWithFallback();
    if (!stocksRes || !overviewRes || !companiesRes) throw new Error('Failed to fetch required data');

    // Company data
    const companyDataMap = {};
    if (companiesRes.data.success && companiesRes.data.data) {
      companiesRes.data.data.forEach(c => {
        if (c?.symbol) companyDataMap[c.symbol] = { equity: c.equity || {}, ratios: c.ratios || {}, financials: c.financials || {}, payouts: c.payouts || [], stats: c.stats || {}, companyName: c.companyName, sector: c.sector };
      });
    }
    setCompanyData(companyDataMap);

    // OHLC map
    const ohlcMap = {};
    if (companiesRes.data.success && companiesRes.data.data) {
      companiesRes.data.data.forEach(c => {
        if (c?.symbol && c.ohlc) ohlcMap[c.symbol] = { open: c.ohlc.open, high: c.ohlc.high, low: c.ohlc.low, close: c.ohlc.close, dayVolume: c.ohlc.volume || 0 };
      });
    }

    // Merge stocks
    let processed = [];
    if (stocksRes.data.success) {
      processed = stocksRes.data.data.map(stock => {
        const enriched = enrichedResponse?.data?.data?.find(e => e.symbol === stock.symbol);
        const ohlc = ohlcMap[stock.symbol];
        return {
          ...stock, ...enriched,
          open: ohlc?.open ?? stock.price, high: ohlc?.high ?? stock.price,
          low: ohlc?.low ?? stock.price, close: ohlc?.close ?? stock.price,
          dayVolume: ohlc?.dayVolume ?? stock.volume,
        };
      });
      setStocks(processed);
      setSelectedStock(prev => prev ? processed.find(s => s.symbol === prev.symbol) || prev : processed[0]);
    }

    // Top opportunities
    try {
      const oppRes = await tradingAPI.getTopOpportunities(10);
      if (oppRes?.data?.success) setTopOpportunities(oppRes.data.data);
    } catch (e) {}

    if (overviewRes.data.success) {
      setMarketStats({ ...overviewRes.data.data, totalStocks: processed.length, activeStocks: processed.filter(s => s.price).length, session: sessionRef.current });
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
}, []);
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) return 300;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

useEffect(() => {
  checkHealth();
  fetchData(false);

  if (intervalRef.current) clearInterval(intervalRef.current);
  intervalRef.current = setInterval(() => {
    if (!fetchingRef.current) fetchData(false);
  }, 300000);

  return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
}, []);

  const handleManualRefresh = () => {
    fetchData(true);
  };

 const handleStockClick = (stock) => {
  if (!stock?.candles && stock?.symbol) {
    const fullStock = stocks.find(s => s.symbol === stock.symbol);
    setSelectedStock(fullStock || stock);
  } else {
    setSelectedStock(stock);
  }
  setModalOpen(true);
};

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredStocks = stocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // REMOVE this block:
// if (loading && stocks.length === 0) {
//   return (
//     <div className="dashboard-loading">
//       <div className="spinner"></div>
//       <p>Loading PSX Data...</p>
//     </div>
//   );
// }

// KEEP the normal return always (it handles empty states)
  return (
    <div className="dashboard">
      <Toaster position="top-right" theme="dark" />

      <Header
  lastUpdate={lastUpdate}
  isConnected={isConnected}
  onRefresh={handleManualRefresh}
  marketStats={marketStats}
  nextRefresh={refreshCountdown}
  sessionInfo={sessionInfo}
  topOpportunitiesCount={topOpportunities.length}
/>

      {/* New Components Row */}
      <div className="dashboard-top-row">
        <SessionIndicator />
        <MarketBreadth />
      </div>

      {marketVolume && (
  <div className={`volume-bar ${marketVolume.marketVolumeSentiment?.toLowerCase()}`}>
    <span>📊 Volume Breadth: {marketVolume.volumeBreadth}%</span>
    <span>{marketVolume.highVolumeStocks} stocks on high volume</span>
    <span className="volume-advice">{marketVolume.advice}</span>
  </div>
)}

{kseVolume?.signal && (
  <div className="kse-volume-bar" style={{ borderLeftColor: kseVolume.signal.color }}>
    <span>📊 KSE-100 Volume: <strong>{kseVolume.currentRatio}%</strong> of avg</span>
    <span>Trend: {kseVolume.volumeTrend}</span>
    <span style={{ color: kseVolume.signal.color }}>{kseVolume.signal.message}</span>
    {kseVolume.estimatedCompletion && (
      <span>⏱️ 100% est: {kseVolume.estimatedCompletion}</span>
    )}
    {kseVolume.timePatterns?.peakBucket && (
      <span>🔺 Peak: {kseVolume.timePatterns.peakBucket} (avg {kseVolume.timePatterns.peakVolume?.toLocaleString()})</span>
    )}
  </div>
)}

 {geoData?.aiAnalysis && (
  <div className={`geo-alert ${geoData.aiAnalysis.alertLevel?.toLowerCase()}`}>
    <span>
      🌍 Geo: {geoData.aiAnalysis.marketDirection} | Impact: {geoData.aiAnalysis.impactScore > 0 ? '+' : ''}{geoData.aiAnalysis.impactScore}
    </span>
    <span className="geo-summary">{geoData.aiAnalysis.summary}</span>
    {geoData.aiAnalysis.action && (
      <span className="geo-action">{geoData.aiAnalysis.action}</span>
    )}
    {geoData.oilData?.wti && (
      <span className="geo-oil">
        🛢️ WTI: ${geoData.oilData.wti.price} | Brent: ${geoData.oilData.brent?.price}
      </span>
    )}
  </div>
)}

{marketNews?.consensus && (
  <div className={`market-news-bar ${marketNews.consensus.stable ? 'stable' : 'unstable'}`}>
    <span className="news-sentiment" style={{ 
      color: marketNews.consensus.consensus === 'BULLISH' ? '#22c55e' : 
             marketNews.consensus.consensus === 'BEARISH' ? '#ef4444' : '#f59e0b'
    }}>
      📊 Market: {marketNews.consensus.consensus} 
      ({marketNews.consensus.agreement}% agreement)
    </span>
    <span className="news-advice">
      {marketNews.consensus.advice}
    </span>
    {!marketNews.consensus.stable && (
      <span className="unstable-badge">⚠️ Mixed signals — wait for confirmation</span>
    )}
  </div>
)}

      {/* Top Opportunities */}
      <TopOpportunities 
        onSelectStock={handleStockClick} 
        limit={5} 
      />

      <div className="view-toggle">
  <div className="view-toggle-left">
    <button className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => setViewMode('cards')}>📇 Cards</button>
    <button className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>📊 Table</button>
    {loading && <span className="loading-dot">🔄</span>}
  </div>
  <span className="countdown-timer">
    ⏱️ Next refresh: {formatCountdown(refreshCountdown)}
  </span>
</div>

      <StockLookup />

      <div className="dashboard-content">
        {viewMode === 'cards' ? (
          <>
            <div className="dashboard-left">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search symbol... (e.g., FFC, OGDC)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>

              <div className="stocks-grid">
                {filteredStocks.length === 0 ? (
                  <div className="no-results">
                    <p>No stocks found</p>
                  </div>
                ) : (
                  filteredStocks.map(stock => (
                    <StockCard
                      key={stock.symbol}
                      stock={stock}
                      onClick={() => handleStockClick(stock)}
                      onAnalyze={() => handleStockClick(stock)}
                      loading={false}
                    />
                  ))
                )}
              </div>
            </div>
            <div className="dashboard-right">
              {selectedStock && (
                <Chart
                  candles={selectedStock.candles || []}
                  candles15Min={selectedStock.candles15Min || []}
                  symbol={selectedStock.symbol}
                  trend15Min={{
                    trend: selectedStock.trend15Min,
                    strength: selectedStock.trendStrength15Min,
                    reason: selectedStock.trendReason15Min
                  }}
                  confidence={selectedStock.confidence}
                  riskLevels={selectedStock.riskLevels}
                />
              )}
            </div>
          </>
        ) : (
          <div className="dashboard-full">
            <div className="search-bar table-search">
              <input
                type="text"
                placeholder="Search symbol... (e.g., FFC, OGDC)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            <IndicatorsTable
              stocks={filteredStocks}
              onSelectStock={(stock) => {
                setSelectedStock(stock);
                setViewMode('cards');
              }}
            />
            {selectedStock && (
              <div className="table-chart">
                <Chart 
                  candles={selectedStock.candles} 
                  symbol={selectedStock.symbol}
                  confidence={selectedStock.confidence}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stock Detail Modal - Replaces AnalysisModal */}
      <StockDetailModal
        stock={selectedStock}
        onClose={() => {
          setModalOpen(false);
          setSelectedStock(null);
        }}
      />
    </div>
  );
};

export default Dashboard;