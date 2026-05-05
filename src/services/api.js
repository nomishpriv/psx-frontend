import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';
// const API_BASE_URL = 'https://darkgreen-beaver-138407.hostingersite.com';
// const API_BASE_URL = 'https://operators-cell-asbestos-upgrades.trycloudflare.com/api';

// Create axios instance with longer timeout for 43 symbols
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased to 60 seconds for batch fetching
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url}`, 
      Array.isArray(response.data?.data) ? 
      `(${response.data.data.length} items)` : 
      response.data
    );
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('❌ API Timeout: Request took too long');
    } else if (error.response) {
      console.error(`❌ API Error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error('❌ API Error: No response from server');
    } else {
      console.error('❌ API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Retry logic for failed requests
const withRetry = async (apiCall, retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i === retries) throw error;
      console.log(`🔄 Retrying request (${i + 1}/${retries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};



// ============ PSX Intraday API (Existing) ============
export const psxAPI = {
  // Get all stocks with intraday data
  getAllStocks: () => api.get('/psx/stocks'),
  
  // Get all stocks with retry
  getAllStocksWithRetry: () => withRetry(() => api.get('/psx/stocks'), 2),
  
  // Get single stock intraday data
  getStock: (symbol) => api.get(`/psx/stocks/${symbol}`),
  
  // Get market overview
  getMarketOverview: () => api.get('/psx/market/overview'),
};

// ============ NEW PREDICTABLE TRADING API ============

export const tradingAPI = {
  
  // Get enriched stocks with confidence scores, risk levels, session analysis
  getEnrichedStocks: () => api.get('/psx/enriched-stocks'),

  getStockAnalysis: (symbol) => api.get('/psx/analysis/' + symbol),

  getKSE100Volume: () => api.get('/psx/kse100/volume'),

  getStockVolume: (symbol) => api.get('/psx/volume/stock/' + symbol),
getMarketVolume: () => api.get('/psx/volume/market'),

  getGeopolitical: () => api.get('/psx/geopolitical'),

getStockNews: (symbol) => api.get('/psx/news/' + symbol),
getMarketNews: () => api.get('/psx/news'),
  
  // Get top trading opportunities based on confidence
  getTopOpportunities: (limit = 10) => api.get(`/psx/top-opportunities?limit=${limit}`),
  
  // Get enhanced market summary with confidence metrics
  getMarketSummaryEnhanced: () => api.get('/psx/market-summary-enhanced'),
  
  // Get risk levels (SL/TP) for a specific stock
  getStockRiskLevels: (symbol) => api.get(`/psx/stock/${symbol}/risk`),
  
  // Get Fibonacci levels for a specific stock
  getStockFibonacci: (symbol) => api.get(`/psx/stock/${symbol}/fibonacci`),
  
  // Get support/resistance levels for a specific stock
  getStockSupportResistance: (symbol) => api.get(`/psx/stock/${symbol}/support-resistance`),
  
  // Get session advice for a specific stock
  getStockSessionAdvice: (symbol) => api.get(`/psx/stock/${symbol}/session`),
  
  // ============ Scan Endpoints ============
  
  // Scan for bullish setups
  scanBullish: () => api.get('/psx/scan/bullish'),
  
  // Scan for bearish setups
  scanBearish: () => api.get('/psx/scan/bearish'),
  
  // Scan for oversold bounce candidates
  scanOversold: () => api.get('/psx/scan/oversold'),
  
  // Scan for overbought pullback candidates
  scanOverbought: () => api.get('/psx/scan/overbought'),
  
  // ============ Cache Management ============
  
  // Clear all cached data
  clearCache: () => api.post('/psx/cache/clear'),
};

// ============ Stock Fundamentals API (Existing) ============
export const stockAPI = {
  // Get all companies fundamental data
  getAllCompanies: () => api.get('/stock/companies'),
  
  // Get all companies with retry (for large batch)
  getAllCompaniesWithRetry: () => withRetry(() => api.get('/stock/companies'), 2),
  
  // Get single company data
  getCompany: (symbol) => api.get(`/stock/companies/${symbol}`),
  
  // Search companies
  searchCompanies: (query) => api.get(`/stock/companies/search`, { params: { q: query } }),
  
  // Get market summary
  getMarketSummary: () => api.get('/stock/market/summary'),
  
  // Get fundamentals with recommendation
  getFundamentalsWithRecommendation: (symbol) => api.get(`/stock/companies/${symbol}/fundamentals`),
  
  // Get financial ratios
  getFinancialRatios: (symbol) => api.get(`/stock/companies/${symbol}/ratios`),
  
  // Get companies by sector
  getCompaniesBySector: (sector) => api.get(`/stock/sector/${sector}`),
  
  // Get all sectors
  getAllSectors: () => api.get('/stock/sectors/list'),
  
  // Get top gainers
  getTopGainers: (limit = 10) => api.get(`/stock/top-gainers?limit=${limit}`),
  
  // Get top losers
  getTopLosers: (limit = 10) => api.get(`/stock/top-losers?limit=${limit}`),
  
  // Get most active
  getMostActive: (limit = 10) => api.get(`/stock/most-active?limit=${limit}`),
  
  // Get 52-week high stocks
  getFiftyTwoWeekHigh: () => api.get('/stock/52week-high'),
  
  // Get 52-week low stocks
  getFiftyTwoWeekLow: () => api.get('/stock/52week-low'),
  
  // Get undervalued stocks
  getUndervaluedStocks: () => api.get('/stock/undervalued'),
  
  // Get high dividend stocks
  getHighDividendStocks: () => api.get('/stock/high-dividend'),
  
  // Stock screener
  stockScreener: (filters) => api.get('/stock/screener', { params: filters }),
  
  // Compare multiple stocks
  compareStocks: (symbols) => api.get(`/stock/compare/${symbols}`),
  
  // Get AI-based recommendations
  getRecommendations: () => api.get('/stock/recommendations'),
  
  // Get stock insights
  getStockInsights: (symbol) => api.get(`/stock/insights/${symbol}`),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

// Combined API for batch operations
export const batchAPI = {
  // Fetch all data in one call (uses backend batch endpoint if available)
  getAllData: async () => {
    try {
      const [stocks, overview, companies] = await Promise.all([
        psxAPI.getAllStocks(),
        psxAPI.getMarketOverview(),
        stockAPI.getAllCompanies()
      ]);
      return { stocks, overview, companies };
    } catch (error) {
      console.error('Batch fetch failed:', error);
      throw error;
    }
  },
  
  // Fetch enriched data (new)
  getAllEnrichedData: async () => {
    try {
      const [enrichedStocks, marketSummary, topOpportunities, marketBreadth] = await Promise.all([
        tradingAPI.getEnrichedStocks(),
        tradingAPI.getMarketSummaryEnhanced(),
        tradingAPI.getTopOpportunities(10),
        tradingAPI.scanBullish()
      ]);
      return { enrichedStocks, marketSummary, topOpportunities, marketBreadth };
    } catch (error) {
      console.error('Batch enriched fetch failed:', error);
      throw error;
    }
  },
  
  // Fetch with fallback (try batch first, then individual)
  getAllDataWithFallback: async () => {
    try {
      return await batchAPI.getAllData();
    } catch (error) {
      console.log('Batch fetch failed, trying individual requests...');
      
      const results = {
        stocks: null,
        overview: null,
        companies: null
      };
      
      try {
        results.stocks = await psxAPI.getAllStocks();
      } catch (e) {
        console.error('Stocks fetch failed:', e);
      }
      
      try {
        results.overview = await psxAPI.getMarketOverview();
      } catch (e) {
        console.error('Overview fetch failed:', e);
      }
      
      try {
        results.companies = await stockAPI.getAllCompanies();
      } catch (e) {
        console.error('Companies fetch failed:', e);
      }
      
      return results;
    }
  }
};

export default api;