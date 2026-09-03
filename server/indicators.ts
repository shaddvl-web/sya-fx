import { Candle, TechnicalAnalysisDto, MacdValueDto, BollingerBandsDto, AdxDto, StochasticDto } from './types';

export function calculateEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = new Array(values.length);
  
  // Seed first EMA with SMA
  let sum = 0;
  const seedLength = Math.min(period, values.length);
  for (let i = 0; i < seedLength; i++) sum += values[i];
  ema[seedLength - 1] = sum / seedLength;

  for (let i = 0; i < seedLength - 1; i++) {
    ema[i] = values[i];
  }

  for (let i = seedLength; i < values.length; i++) {
    ema[i] = values[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

export function calculateRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(50);
  if (closes.length <= period) return rsi;

  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  gain /= period;
  loss /= period;

  rsi[period] = loss === 0 ? 100 : 100 - (100 / (1 + gain / loss));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? -diff : 0;

    gain = (gain * (period - 1) + currentGain) / period;
    loss = (loss * (period - 1) + currentLoss) / period;

    rsi[i] = loss === 0 ? 100 : 100 - (100 / (1 + gain / loss));
  }
  return rsi;
}

export function calculateMACD(closes: number[], fast = 12, slow = 26, signal = 9): MacdValueDto {
  if (closes.length === 0) {
    return { macdLine: 0, signalLine: 0, histogram: 0, crossover: 'NONE' };
  }
  const emaFast = calculateEMA(closes, fast);
  const emaSlow = calculateEMA(closes, slow);
  const macdSeries: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    macdSeries.push(emaFast[i] - emaSlow[i]);
  }

  const signalSeries = calculateEMA(macdSeries, signal);
  const last = closes.length - 1;
  const macdLine = macdSeries[last];
  const sigLine = signalSeries[last];
  const hist = macdLine - sigLine;

  let crossover = 'NONE';
  if (last > 1) {
    const prevHist = macdSeries[last - 1] - signalSeries[last - 1];
    if (prevHist <= 0 && hist > 0) crossover = 'BULLISH_CROSS';
    else if (prevHist >= 0 && hist < 0) crossover = 'BEARISH_CROSS';
  }

  return {
    macdLine: Number(macdLine.toFixed(5)),
    signalLine: Number(sigLine.toFixed(5)),
    histogram: Number(hist.toFixed(5)),
    crossover
  };
}

export function calculateATR(candles: Candle[], period = 14): number {
  if (candles.length < 2) return 0.0015;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trs.push(tr);
  }

  const seed = Math.min(period, trs.length);
  let atr = trs.slice(0, seed).reduce((a, b) => a + b, 0) / seed;
  for (let i = seed; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }
  return Number(atr.toFixed(5));
}

export function calculateBollingerBands(closes: number[], period = 20, multiplier = 2): BollingerBandsDto {
  if (closes.length < period) {
    const p = closes[closes.length - 1] || 1;
    return { upper: p, middle: p, lower: p, bandwidth: 0, percentB: 50 };
  }
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
  const stdev = Math.sqrt(variance);

  const upper = mean + multiplier * stdev;
  const lower = mean - multiplier * stdev;
  const bandwidth = mean > 0 ? ((upper - lower) / mean) * 100 : 0;
  const current = closes[closes.length - 1];
  const percentB = (upper - lower) > 0 ? ((current - lower) / (upper - lower)) * 100 : 50;

  return {
    upper: Number(upper.toFixed(5)),
    middle: Number(mean.toFixed(5)),
    lower: Number(lower.toFixed(5)),
    bandwidth: Number(bandwidth.toFixed(2)),
    percentB: Number(percentB.toFixed(1))
  };
}

export function calculateADX(candles: Candle[], period = 14): AdxDto {
  if (candles.length < period * 2) {
    return { value: 25.0, plusDi: 22.0, minusDi: 18.0, trendStrength: 'MODERATE' };
  }

  let plusDmSum = 0;
  let minusDmSum = 0;
  let trSum = 0;

  for (let i = 1; i <= period; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;

    const plusDm = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDm = downMove > upMove && downMove > 0 ? downMove : 0;
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );

    plusDmSum += plusDm;
    minusDmSum += minusDm;
    trSum += tr;
  }

  const plusDi = trSum > 0 ? (plusDmSum / trSum) * 100 : 0;
  const minusDi = trSum > 0 ? (minusDmSum / trSum) * 100 : 0;
  const diSum = plusDi + minusDi;
  const dx = diSum > 0 ? (Math.abs(plusDi - minusDi) / diSum) * 100 : 20;

  let trendStrength = 'WEAK';
  if (dx >= 30) trendStrength = 'STRONG_TREND';
  else if (dx >= 20) trendStrength = 'MODERATE';

  return {
    value: Number(dx.toFixed(1)),
    plusDi: Number(plusDi.toFixed(1)),
    minusDi: Number(minusDi.toFixed(1)),
    trendStrength
  };
}

export function calculateStochastic(candles: Candle[], kPeriod = 14, dPeriod = 3): StochasticDto {
  if (candles.length < kPeriod) {
    return { k: 50, d: 50, condition: 'NEUTRAL' };
  }
  const slice = candles.slice(-kPeriod);
  const highest = Math.max(...slice.map(c => c.high));
  const lowest = Math.min(...slice.map(c => c.low));
  const current = candles[candles.length - 1].close;

  const k = (highest - lowest) > 0 ? ((current - lowest) / (highest - lowest)) * 100 : 50;
  const d = k; // smoothed simplified for spot

  let condition = 'NEUTRAL';
  if (k >= 80) condition = 'OVERBOUGHT';
  else if (k <= 20) condition = 'OVERSOLD';

  return {
    k: Number(k.toFixed(1)),
    d: Number(d.toFixed(1)),
    condition
  };
}

export function calculateLevels(candles: Candle[]): { supports: number[]; resistances: number[] } {
  if (candles.length < 15) return { supports: [], resistances: [] };
  const current = candles[candles.length - 1].close;
  const highs: number[] = [];
  const lows: number[] = [];

  for (let i = 2; i < candles.length - 2; i++) {
    if (candles[i].high > candles[i - 1].high && candles[i].high > candles[i + 1].high) {
      highs.push(candles[i].high);
    }
    if (candles[i].low < candles[i - 1].low && candles[i].low < candles[i + 1].low) {
      lows.push(candles[i].low);
    }
  }

  const resistances = highs.filter(h => h > current).sort((a, b) => a - b).slice(0, 3).map(p => Number(p.toFixed(5)));
  const supports = lows.filter(l => l < current).sort((a, b) => b - a).slice(0, 3).map(p => Number(p.toFixed(5)));

  return { supports, resistances };
}

export function calculateVWAP(candles: Candle[]): number {
  if (candles.length === 0) return 0;
  let cumVol = 0;
  let cumPriceVol = 0;
  for (const c of candles) {
    const typical = (c.high + c.low + c.close) / 3;
    const vol = c.volume > 0 ? c.volume : 100;
    cumPriceVol += typical * vol;
    cumVol += vol;
  }
  return cumVol > 0 ? Number((cumPriceVol / cumVol).toFixed(5)) : candles[candles.length - 1].close;
}

export function analyzeTechnicals(candles: Candle[]): TechnicalAnalysisDto {
  const closes = candles.map(c => c.close);
  const lastClose = closes[closes.length - 1] || 1;

  const ema20s = calculateEMA(closes, 20);
  const ema50s = calculateEMA(closes, 50);
  const ema200s = calculateEMA(closes, 200);

  const ema20 = ema20s[ema20s.length - 1] || lastClose;
  const ema50 = ema50s[ema50s.length - 1] || lastClose;
  const ema200 = ema200s[ema200s.length - 1] || lastClose;

  const rsis = calculateRSI(closes, 14);
  const rsi14 = Number(rsis[rsis.length - 1].toFixed(1));
  const rsiCondition = rsi14 >= 70 ? 'OVERBOUGHT' : (rsi14 <= 30 ? 'OVERSOLD' : 'NEUTRAL');

  const macd = calculateMACD(closes);
  const atr14 = calculateATR(candles, 14);
  const bollingerBands = calculateBollingerBands(closes);
  const adx = calculateADX(candles);
  const stochastic = calculateStochastic(candles);
  const { supports, resistances } = calculateLevels(candles);
  const vwap = calculateVWAP(candles);

  let bull = 0;
  let bear = 0;
  if (lastClose > ema20) bull++; else bear++;
  if (ema20 > ema50) bull++; else bear++;
  if (lastClose > ema200) bull += 2; else bear += 2;
  if (macd.histogram > 0) bull++; else bear++;
  if (rsi14 > 50 && rsi14 < 70) bull++;
  else if (rsi14 < 50 && rsi14 > 30) bear++;
  if (adx.plusDi > adx.minusDi) bull++; else bear++;
  if (lastClose > vwap) bull++; else bear++;

  const overallTechnicalBias = bull >= bear + 3 ? 'BULLISH' : (bear >= bull + 3 ? 'BEARISH' : 'NEUTRAL');

  return {
    ema20: Number(ema20.toFixed(5)),
    ema50: Number(ema50.toFixed(5)),
    ema200: Number(ema200.toFixed(5)),
    rsi14,
    rsiCondition,
    macd,
    atr14,
    bollingerBands,
    adx,
    stochastic,
    supportLevels: supports,
    resistanceLevels: resistances,
    vwap,
    overallTechnicalBias
  };
}
