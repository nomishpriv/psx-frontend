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
    if (fetchingRef.current) {
      console.log('⏳ Fetch already in progress, skipping...');
      return;
    }

    fetchingRef.current = true;

    try {
      setLoading(true);

      // Fetch enriched data from new endpoint
      let enrichedResponse = null;
      try {
        enrichedResponse = await tradingAPI.getEnrichedStocks();
        if (enrichedResponse?.data?.success) {
          setEnrichedStocks(enrichedResponse.data.data);
          setSessionInfo(enrichedResponse.data.session);
        }
      } catch (enrichedError) {
        console.warn('Enriched API failed, falling back to legacy:', enrichedError);
      }

      // Fetch market breadth
      try {
        const breadthResponse = await tradingAPI.scanBullish();
        if (breadthResponse?.data?.success) {
          setMarketBreadth(breadthResponse.data);
        }
      } catch (breadthError) {
        console.warn('Failed to fetch market breadth:', breadthError);
      }

      // Fallback to legacy data if enriched fails
      const { stocks: stocksRes, overview: overviewRes, companies: companiesRes } =
        await batchAPI.getAllDataWithFallback();

      if (!stocksRes || !overviewRes || !companiesRes) {
        throw new Error('Failed to fetch all required data');
      }

      // Process company data
      const companyDataMap = {};
      if (companiesRes.data.success && companiesRes.data.data) {
        companiesRes.data.data.forEach(company => {
          if (company && company.symbol) {
            companyDataMap[company.symbol] = {
              equity: company.equity || {},
              ratios: company.ratios || {},
              financials: company.financials || { annual: {}, quarterly: {} },
              payouts: company.payouts || [],
              stats: company.stats || {},
              companyName: company.companyName,
              sector: company.sector,
            };
          }
        });
      }
      setCompanyData(companyDataMap);

      // Process OHLC data
      const correctOHLCMap = {};
      if (companiesRes.data.success && companiesRes.data.data) {
        companiesRes.data.data.forEach(company => {
          if (company && company.symbol && company.ohlc) {
            correctOHLCMap[company.symbol] = {
              open: company.ohlc.open || company.price,
              high: company.ohlc.high || company.price,
              low: company.ohlc.low || company.price,
              close: company.ohlc.close || company.price,
              dayVolume: company.ohlc.volume || 0,
            };
          }
        });
      }

      // Merge enriched data with legacy data if available
      let processedStocks = [];
      if (stocksRes.data.success) {
        processedStocks = stocksRes.data.data.map(stock => {
          const enriched = enrichedResponse?.data?.data?.find(e => e.symbol === stock.symbol);
          const correctOHLC = correctOHLCMap[stock.symbol];
          
          return {
            ...stock,
            ...enriched,
            open: correctOHLC?.open ?? stock.open ?? stock.price,
            high: correctOHLC?.high ?? stock.high ?? stock.price,
            low: correctOHLC?.low ?? stock.low ?? stock.price,
            close: correctOHLC?.close ?? stock.close ?? stock.price,
            dayVolume: correctOHLC?.dayVolume ?? stock.volume,
            confidence: enriched?.confidence,
            riskLevels: enriched?.riskLevels,
            tradeRecommendation: enriched?.tradeRecommendation,
            currentSession: enriched?.currentSession,
            sessionAdvice: enriched?.sessionAdvice,
            fibonacci: enriched?.fibonacci,
            supportResistance: enriched?.supportResistance,
          };
        });

        setStocks(processedStocks);

        setSelectedStock(prev => {
          if (!prev && processedStocks.length > 0) {
            return processedStocks[0];
          }
          if (prev) {
            const updated = processedStocks.find(s => s.symbol === prev.symbol);
            return updated || prev;
          }
          return prev;
        });
      }

      // Fetch top opportunities
      try {
        const opportunitiesRes = await tradingAPI.getTopOpportunities(10);
        if (opportunitiesRes?.data?.success) {
          setTopOpportunities(opportunitiesRes.data.data);
        }
      } catch (oppError) {
        console.warn('Failed to fetch top opportunities:', oppError);
      }

      if (overviewRes.data.success) {
        setMarketStats({
          ...overviewRes.data.data,
          totalStocks: stocksRes.data.data?.length || 0,
          activeStocks: stocksRes.data.data?.filter(s => s.price).length || 0,
          session: sessionInfo
        });
      }

      setIsConnected(true);
      setLastUpdate(new Date().toLocaleTimeString('en-PK', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }));

      setRefreshCountdown(300);

      if (isManualRefresh) {
        toast.success('Data refreshed successfully');
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
      setIsConnected(false);
      if (isManualRefresh) {
        toast.error('Failed to fetch stock data');
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [sessionInfo]);

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

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => fetchData(false), 300000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, checkHealth]);

  const handleManualRefresh = () => {
    fetchData(true);
  };

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
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

  if (loading && stocks.length === 0) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading PSX Data...</p>
      </div>
    );
  }

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

      {/* Top Opportunities */}
      <TopOpportunities 
        onSelectStock={handleStockClick} 
        limit={5} 
      />

      <div className="view-toggle">
        <div className="view-toggle-left">
          <button
            className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            📇 Cards
          </button>
          <button
            className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            📊 Table
          </button>
        </div>
        <span className="countdown-timer">
          ⏱️ Next refresh: {formatCountdown(refreshCountdown)}
        </span>
      </div>

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