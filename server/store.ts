import { SignalRecord } from './types';

class MemoryStore {
  private signals: SignalRecord[] = [];
  private nextId = 1;

  constructor() {
    this.seedSignals();
  }

  private seedSignals() {
    const seedData: Omit<SignalRecord, 'id'>[] = [
      {
        symbol: 'EUR_USD',
        timeframe: 'M15',
        signalType: 'BUY',
        score: 84.5,
        confidence: 85,
        entry: 1.08420,
        stopLoss: 1.08260,
        takeProfit1: 1.08670,
        takeProfit2: 1.08910,
        riskRewardRatio: 1.56,
        timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
        result: 'WIN',
        strategyVersion: 'v1.0-CONFLUENCE',
        technicalScore: 82,
        structureScore: 88,
        patternScore: 84,
        momentumScore: 86,
        riskScore: 80,
        notes: 'Bullish BOS confirmed | EMA 20/50 alignment'
      },
      {
        symbol: 'GBP_USD',
        timeframe: 'H1',
        signalType: 'BUY',
        score: 79.2,
        confidence: 80,
        entry: 1.29650,
        stopLoss: 1.29380,
        takeProfit1: 1.30080,
        takeProfit2: 1.30450,
        riskRewardRatio: 1.59,
        timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
        result: 'OPEN',
        strategyVersion: 'v1.0-CONFLUENCE',
        technicalScore: 78,
        structureScore: 82,
        patternScore: 76,
        momentumScore: 80,
        riskScore: 75,
        notes: 'London session breakout | Higher Low defended'
      },
      {
        symbol: 'USD_JPY',
        timeframe: 'M15',
        signalType: 'SELL',
        score: 81.0,
        confidence: 82,
        entry: 151.850,
        stopLoss: 152.180,
        takeProfit1: 151.320,
        takeProfit2: 150.900,
        riskRewardRatio: 1.61,
        timestamp: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
        result: 'WIN',
        strategyVersion: 'v1.0-CONFLUENCE',
        technicalScore: 80,
        structureScore: 85,
        patternScore: 80,
        momentumScore: 82,
        riskScore: 78,
        notes: 'Bearish Engulfing at major resistance | RSI divergence'
      },
      {
        symbol: 'XAU_USD',
        timeframe: 'M15',
        signalType: 'BUY',
        score: 88.0,
        confidence: 90,
        entry: 2892.40,
        stopLoss: 2884.20,
        takeProfit1: 2905.50,
        takeProfit2: 2918.00,
        riskRewardRatio: 1.60,
        timestamp: new Date(Date.now() - 340 * 60 * 1000).toISOString(),
        result: 'WIN',
        strategyVersion: 'v1.0-CONFLUENCE',
        technicalScore: 88,
        structureScore: 92,
        patternScore: 86,
        momentumScore: 90,
        riskScore: 84,
        notes: 'Clean double bottom retest | Impulsive expansion volume'
      },
      {
        symbol: 'AUD_USD',
        timeframe: 'H1',
        signalType: 'SELL',
        score: 76.5,
        confidence: 77,
        entry: 0.65580,
        stopLoss: 0.65820,
        takeProfit1: 0.65200,
        takeProfit2: 0.64850,
        riskRewardRatio: 1.58,
        timestamp: new Date(Date.now() - 480 * 60 * 1000).toISOString(),
        result: 'LOSS',
        strategyVersion: 'v1.0-CONFLUENCE',
        technicalScore: 74,
        structureScore: 78,
        patternScore: 75,
        momentumScore: 72,
        riskScore: 70,
        notes: 'Bearish trend continuation test'
      },
      {
        symbol: 'USD_CAD',
        timeframe: 'M15',
        signalType: 'BUY',
        score: 83.0,
        confidence: 84,
        entry: 1.37950,
        stopLoss: 1.37700,
        takeProfit1: 1.38350,
        takeProfit2: 1.38700,
        riskRewardRatio: 1.60,
        timestamp: new Date(Date.now() - 620 * 60 * 1000).toISOString(),
        result: 'WIN',
        strategyVersion: 'v1.0-CONFLUENCE',
        technicalScore: 82,
        structureScore: 86,
        patternScore: 80,
        momentumScore: 85,
        riskScore: 80,
        notes: 'Liquidity sweep below key support before rally'
      }
    ];

    for (const item of seedData) {
      this.signals.push({ id: this.nextId++, ...item });
    }
  }

  public getSignals(symbol?: string, signalType?: string, limit = 50): SignalRecord[] {
    let list = [...this.signals];
    if (symbol) {
      const cleanSym = symbol.toUpperCase().replace('/', '_');
      list = list.filter(s => s.symbol === cleanSym);
    }
    if (signalType) {
      const cleanType = signalType.toUpperCase();
      list = list.filter(s => s.signalType === cleanType);
    }
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list.slice(0, limit);
  }

  public recordSignal(sig: Omit<SignalRecord, 'id'>): SignalRecord {
    // Check if recent same symbol + timeframe exists
    const recent = this.signals.find(s =>
      s.symbol === sig.symbol &&
      s.timeframe === sig.timeframe &&
      Math.abs(new Date(s.timestamp).getTime() - new Date(sig.timestamp).getTime()) < 15 * 60 * 1000
    );

    if (recent) return recent;

    const record: SignalRecord = { id: this.nextId++, ...sig };
    this.signals.unshift(record);
    if (this.signals.length > 200) this.signals.pop();
    return record;
  }
}

export const signalStore = new MemoryStore();
