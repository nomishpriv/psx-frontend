import axios from 'axios';

const API_BASE_URL = 'https://darkgreen-beaver-138407.hostingersite.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// ============ CACHE ============
const cache = new Map();
const CACHE_TTL = 30000;

function cacheGet(key) {
  const e = cache.get(key);
  if (!e || Date.now() - e.t > CACHE_TTL) { cache.delete(key); return null; }
  return e.data;
}
function cacheSet(key, data) { cache.set(key, { data, t: Date.now() }); }

// ============ INTERCEPTORS ============
api.interceptors.request.use(c => { console.log(`🚀 ${c.method.toUpperCase()} ${c.url}`); return c; });
api.interceptors.response.use(
  r => { console.log(`✅ ${r.config.url}`, Array.isArray(r.data?.data) ? `(${r.data.data.length})` : ''); return r; },
  e => {
    if (e.code === 'ECONNABORTED') console.error('❌ Timeout');
    else if (e.response) console.error(`❌ ${e.response.status}`, e.response.data);
    else console.error('❌ No response');
    return Promise.reject(e);
  }
);

// ============ RETRY ============
async function withRetry(fn, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (e) { if (i === retries) throw e; await new Promise(r => setTimeout(r, 1000 * (i + 1))); }
  }
}

// ============ CACHED GET ============
async function cachedGet(key, fn) {
  const hit = cacheGet(key);
  if (hit) return { data: hit };
  const res = await fn();
  if (res?.data) cacheSet(key, res.data);
  return res;
}

// ============ PSX ============
export const psxAPI = {
  getAllStocks: () => cachedGet('stocks', () => api.get('/api/psx/stocks')),
  getStock: s => api.get(`/api/psx/stocks/${s}`),
  getMarketOverview: () => cachedGet('overview', () => api.get('/api/psx/market/overview'))
};

// ============ TRADING ============
export const tradingAPI = {
  getEnrichedStocks: () => cachedGet('enriched', () => api.get('/api/psx/enriched-stocks')),
  getTopOpportunities: (n = 10) => cachedGet(`opps_${n}`, () => api.get(`/api/psx/top-opportunities?limit=${n}`)),
  getMarketSummaryEnhanced: () => cachedGet('summary', () => api.get('/api/psx/market-summary-enhanced')),
  getStockRiskLevels: s => api.get(`/api/psx/stock/${s}/risk`),
  getStockFibonacci: s => api.get(`/api/psx/stock/${s}/fibonacci`),
  getStockSupportResistance: s => api.get(`/api/psx/stock/${s}/support-resistance`),
  getStockSessionAdvice: s => api.get(`/api/psx/stock/${s}/session`),
  scanBullish: () => cachedGet('bullish', () => api.get('/api/psx/scan/bullish')),
  scanBearish: () => api.get('/api/psx/scan/bearish'),
  scanOversold: () => api.get('/api/psx/scan/oversold'),
  scanOverbought: () => api.get('/api/psx/scan/overbought'),
  clearCache: () => api.post('/api/psx/cache/clear')
};

// ============ STOCK ============
export const stockAPI = {
  getAllCompanies: () => cachedGet('companies', () => api.get('/api/stock/companies')),
  getCompany: s => api.get(`/api/stock/companies/${s}`),
  searchCompanies: q => api.get('/api/stock/companies/search', { params: { q } }),
  getMarketSummary: () => api.get('/api/stock/market/summary'),
  getFundamentals: s => api.get(`/api/stock/companies/${s}/fundamentals`),
  getRatios: s => api.get(`/api/stock/companies/${s}/ratios`),
  getBySector: s => api.get(`/api/stock/sector/${s}`),
  getAllSectors: () => api.get('/api/stock/sectors/list'),
  getTopGainers: (n = 10) => api.get(`/api/stock/top-gainers?limit=${n}`),
  getTopLosers: (n = 10) => api.get(`/api/stock/top-losers?limit=${n}`),
  getMostActive: (n = 10) => api.get(`/api/stock/most-active?limit=${n}`),
  get52WeekHigh: () => api.get('/api/stock/52week-high'),
  get52WeekLow: () => api.get('/api/stock/52week-low'),
  getUndervalued: () => api.get('/api/stock/undervalued'),
  getHighDividend: () => api.get('/api/stock/high-dividend'),
  screener: f => api.get('/api/stock/screener', { params: f }),
  compare: s => api.get(`/api/stock/compare/${s}`),
  getRecommendations: () => api.get('/api/stock/recommendations'),
  getInsights: s => api.get(`/api/stock/insights/${s}`)
};

// ============ HEALTH ============
export const healthAPI = {
  check: () => api.get('/api/health')
};

// ============ BATCH ============
export const batchAPI = {
  getAllData: async () => {
    const [stocks, overview, companies, enriched, summary] = await Promise.allSettled([
      psxAPI.getAllStocks(), psxAPI.getMarketOverview(), stockAPI.getAllCompanies(),
      tradingAPI.getEnrichedStocks(), tradingAPI.getMarketSummaryEnhanced()
    ]);
    return {
      stocks: stocks.value?.data, overview: overview.value?.data, companies: companies.value?.data,
      enriched: enriched.value?.data, summary: summary.value?.data
    };
  },
  getAllDataWithFallback: async () => {
    // Your existing fallback logic unchanged
    try {
      return await batchAPI.getAllData();
    } catch {
      const r = { stocks: null, overview: null, companies: null };
      try { r.stocks = await psxAPI.getAllStocks(); } catch {}
      try { r.overview = await psxAPI.getMarketOverview(); } catch {}
      try { r.companies = await stockAPI.getAllCompanies(); } catch {}
      return r;
    }
  }
};

export default api;