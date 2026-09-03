import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { fetchCandles, fetchQuote, getAllQuotes, normalizeSymbol, SYMBOLS } from './server/marketData';
import { analyzeTechnicals } from './server/indicators';
import { analyzeMarketStructure } from './server/structure';
import { detectPatterns } from './server/patterns';
import { evaluateConfluence, calculateRisk } from './server/confluence';
import { signalStore } from './server/store';
import { runBacktestEngine } from './server/backtest';
import { runAiAnalyst } from './server/ai';
import { FullAnalysisDto } from './server/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper function to build full analysis
async function getFullAnalysis(symbol: string, timeframe = 'M15'): Promise<FullAnalysisDto> {
  const normSym = normalizeSymbol(symbol);
  const meta = SYMBOLS[normSym];
  const quote = await fetchQuote(normSym);
  const candles = await fetchCandles(normSym, timeframe, 120);

  if (candles.length === 0) {
    throw new Error(`No candle data available for ${normSym}`);
  }

  const technical = analyzeTechnicals(candles);
  const structure = analyzeMarketStructure(candles);
  const patterns = detectPatterns(candles);
  const signal = evaluateConfluence(normSym, timeframe, candles, technical, structure, patterns);

  const currentPrice = candles[candles.length - 1].close;
  const digits = meta?.digits ?? 5;
  const risk = calculateRisk(currentPrice, signal.signal, technical.atr14, structure, digits, normSym);

  // Auto record signal to store
  try {
    signalStore.recordSignal({
      symbol: normSym,
      timeframe,
      signalType: signal.signal,
      score: signal.finalScore,
      confidence: signal.finalScore,
      entry: risk.entry,
      stopLoss: risk.stopLoss,
      takeProfit1: risk.takeProfit1,
      takeProfit2: risk.takeProfit2,
      riskRewardRatio: risk.riskRewardRatio,
      timestamp: new Date().toISOString(),
      result: 'OPEN',
      strategyVersion: 'v1.0-CONFLUENCE',
      technicalScore: signal.technicalScore,
      structureScore: signal.structureScore,
      patternScore: signal.patternScore,
      momentumScore: signal.momentumScore,
      riskScore: signal.riskScore,
      notes: signal.confluenceFactors.slice(0, 2).join(' | ') || 'Institutional quantitative confluence setup'
    });
  } catch (e) {
    // Ignore store recording errors
  }

  return {
    symbol: normSym,
    timeframe,
    currentPrice,
    quote,
    technical,
    structure,
    patterns,
    signal,
    risk,
    analysisTimestamp: new Date().toISOString()
  };
}

// ---------------------------------------------------------------------------
// REST API ROUTES
// ---------------------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Markets
app.get('/api/markets', async (req, res) => {
  try {
    const quotes = await getAllQuotes();
    res.json({ success: true, data: quotes, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'MARKETS_FETCH_ERROR', message: err.message } });
  }
});

app.get('/api/markets/:symbol', async (req, res) => {
  try {
    const quote = await fetchQuote(req.params.symbol);
    res.json({ success: true, data: quote, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(404).json({ success: false, error: { code: 'SYMBOL_NOT_FOUND', message: err.message } });
  }
});

// Candles
app.get('/api/candles/:symbol', async (req, res) => {
  try {
    const symbol = normalizeSymbol(req.params.symbol);
    const timeframe = (req.query.timeframe as string) || 'M15';
    const limit = Math.min(300, parseInt((req.query.limit as string) || '120', 10));

    const candles = await fetchCandles(symbol, timeframe, limit);
    res.json({
      success: true,
      data: {
        symbol,
        timeframe,
        count: candles.length,
        candles,
        source: 'MARKET_FEED'
      },
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'CANDLE_FETCH_ERROR', message: err.message } });
  }
});

// Comprehensive Analysis
app.get('/api/analysis/:symbol', async (req, res) => {
  try {
    const timeframe = (req.query.timeframe as string) || 'M15';
    const analysis = await getFullAnalysis(req.params.symbol, timeframe);
    res.json({ success: true, data: analysis, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'ANALYSIS_ERROR', message: err.message } });
  }
});

// Market Structure
app.get('/api/structure/:symbol', async (req, res) => {
  try {
    const timeframe = (req.query.timeframe as string) || 'M15';
    const analysis = await getFullAnalysis(req.params.symbol, timeframe);
    res.json({ success: true, data: analysis.structure, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'STRUCTURE_ERROR', message: err.message } });
  }
});

// Patterns
app.get('/api/patterns/:symbol', async (req, res) => {
  try {
    const timeframe = (req.query.timeframe as string) || 'M15';
    const analysis = await getFullAnalysis(req.params.symbol, timeframe);
    res.json({ success: true, data: analysis.patterns, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'PATTERN_ERROR', message: err.message } });
  }
});

// Confluence Signal
app.get('/api/signals/:symbol', async (req, res) => {
  try {
    const timeframe = (req.query.timeframe as string) || 'M15';
    const analysis = await getFullAnalysis(req.params.symbol, timeframe);
    res.json({ success: true, data: analysis.signal, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SIGNAL_ERROR', message: err.message } });
  }
});

// Signal History
app.get('/api/history', (req, res) => {
  try {
    const symbol = req.query.symbol as string | undefined;
    const signalType = req.query.signalType as string | undefined;
    const limit = parseInt((req.query.limit as string) || '50', 10);

    const history = signalStore.getSignals(symbol, signalType, limit);
    res.json({ success: true, data: history, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'HISTORY_ERROR', message: err.message } });
  }
});

// Backtest
app.post('/api/backtest', async (req, res) => {
  try {
    const body = req.body || {};
    const symbol = normalizeSymbol(body.symbol || 'EUR_USD');
    const timeframe = body.timeframe || 'M15';
    const candles = await fetchCandles(symbol, timeframe, 200);

    const result = runBacktestEngine(body, candles);
    res.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'BACKTEST_ERROR', message: err.message } });
  }
});

// AI Analyst
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const body = req.body || {};
    const symbol = normalizeSymbol(body.symbol || 'EUR_USD');
    const timeframe = body.timeframe || 'M15';
    const lang = body.lang || (req.query.lang as string) || 'ku';

    const analysis = await getFullAnalysis(symbol, timeframe);
    const aiResult = await runAiAnalyst(analysis, lang);

    res.json({ success: true, data: aiResult, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'AI_ANALYSIS_ERROR', message: err.message } });
  }
});

// ---------------------------------------------------------------------------
// VITE MIDDLEWARE & STATIC ASSETS
// ---------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SYA FX] Quantitative Terminal Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
