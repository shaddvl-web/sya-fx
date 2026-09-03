/**
 * SYA FX — Terminal API Client
 * Clean Vanilla JS Fetch wrapper for ASP.NET Core REST API
 */

const Api = {
  baseUrl: '',

  connectionStatus: 'LIVE',
  onStatusChange: null,

  setStatus(status) {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      if (this.onStatusChange) this.onStatusChange(status);
    }
  },

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      if (!json.success && json.error) {
        throw new Error(json.error.message || json.error.code || 'API Error');
      }

      this.setStatus('LIVE');
      return json.data;
    } catch (err) {
      console.warn(`API request error on ${endpoint}:`, err.message);
      this.setStatus('ERROR');
      throw err;
    }
  },

  async getMarkets() {
    return this.request('/api/markets');
  },

  async getMarket(symbol) {
    return this.request(`/api/markets/${encodeURIComponent(symbol)}`);
  },

  async getCandles(symbol, timeframe = 'M15', limit = 120) {
    return this.request(`/api/candles/${encodeURIComponent(symbol)}?timeframe=${timeframe}&limit=${limit}`);
  },

  async getAnalysis(symbol, timeframe = 'M15') {
    return this.request(`/api/analysis/${encodeURIComponent(symbol)}?timeframe=${timeframe}`);
  },

  async getStructure(symbol, timeframe = 'M15') {
    return this.request(`/api/structure/${encodeURIComponent(symbol)}?timeframe=${timeframe}`);
  },

  async getPatterns(symbol, timeframe = 'M15') {
    return this.request(`/api/patterns/${encodeURIComponent(symbol)}?timeframe=${timeframe}`);
  },

  async getSignal(symbol, timeframe = 'M15') {
    return this.request(`/api/signals/${encodeURIComponent(symbol)}?timeframe=${timeframe}`);
  },

  async getHistory(symbol = '', signalType = '', limit = 50) {
    let q = `?limit=${limit}`;
    if (symbol) q += `&symbol=${encodeURIComponent(symbol)}`;
    if (signalType) q += `&signalType=${encodeURIComponent(signalType)}`;
    return this.request(`/api/history${q}`);
  },

  async runBacktest(params) {
    return this.request('/api/backtest', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async runAiAnalysis(symbol, timeframe = 'M15', lang = 'ku') {
    return this.request('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ symbol, timeframe, lang })
    });
  }
};

window.SyaApi = Api;
