import { Candle, TechnicalAnalysisDto, MarketStructureDto, PatternDetectionDto, ConfluenceSignalDto, RiskInfoDto } from './types';

export function evaluateConfluence(
  symbol: string,
  timeframe: string,
  candles: Candle[],
  technical: TechnicalAnalysisDto,
  structure: MarketStructureDto,
  patterns: PatternDetectionDto[]
): ConfluenceSignalDto {
  if (candles.length < 20) {
    return {
      symbol,
      timeframe,
      technicalScore: 50,
      structureScore: 50,
      patternScore: 50,
      momentumScore: 50,
      riskScore: 50,
      finalScore: 50,
      signal: 'WAIT',
      strength: 'WEAK',
      confluenceFactors: [],
      conflictingFactors: ['Insufficient historical bars'],
      timestamp: new Date().toISOString()
    };
  }

  const confluenceFactors: string[] = [];
  const conflictingFactors: string[] = [];

  // 1. Technical Score
  let techBull = 0;
  let techBear = 0;
  const lastClose = candles[candles.length - 1].close;

  if (lastClose > technical.ema200) {
    techBull += 2;
    confluenceFactors.push(`Price above 200 EMA (${technical.ema200})`);
  } else {
    techBear += 2;
    conflictingFactors.push(`Price below 200 EMA (${technical.ema200})`);
  }

  if (technical.ema20 > technical.ema50) {
    techBull++;
    confluenceFactors.push('EMA 20/50 Bullish Alignment');
  } else {
    techBear++;
    conflictingFactors.push('EMA 20/50 Bearish Alignment');
  }

  if (technical.macd.histogram > 0) {
    techBull++;
    confluenceFactors.push('MACD Histogram Positive & Expanding');
  } else {
    techBear++;
    conflictingFactors.push('MACD Histogram Negative');
  }

  if (technical.rsi14 > 50 && technical.rsi14 < 68) {
    techBull++;
    confluenceFactors.push(`RSI in healthy bullish zone (${technical.rsi14})`);
  } else if (technical.rsi14 < 50 && technical.rsi14 > 32) {
    techBear++;
    conflictingFactors.push(`RSI in bearish momentum zone (${technical.rsi14})`);
  } else if (technical.rsi14 >= 70) {
    techBear++;
    conflictingFactors.push(`RSI Overbought (${technical.rsi14}) - caution on longs`);
  } else if (technical.rsi14 <= 30) {
    techBull++;
    confluenceFactors.push(`RSI Oversold (${technical.rsi14}) - oversold bounce probability`);
  }

  const technicalScore = Math.max(15, Math.min(95, Math.round(50 + (techBull - techBear) * 8.5)));

  // 2. Structure Score
  let structureScore = 50;
  if (structure.structure === 'BULLISH') {
    structureScore = Math.max(70, structure.confidence);
    confluenceFactors.push(`Bullish Market Structure (HH/HL confirmed, ${structure.confidence}% confidence)`);
    if (structure.bos && structure.bos.direction === 'BULLISH') {
      structureScore = Math.min(96, structureScore + 8);
      confluenceFactors.push('Confirmed Bullish Break of Structure (BOS)');
    }
  } else if (structure.structure === 'BEARISH') {
    structureScore = Math.max(70, structure.confidence);
    conflictingFactors.push(`Bearish Market Structure (LH/LL confirmed, ${structure.confidence}% confidence)`);
    if (structure.bos && structure.bos.direction === 'BEARISH') {
      structureScore = Math.min(96, structureScore + 8);
      conflictingFactors.push('Confirmed Bearish Break of Structure (BOS)');
    }
  } else {
    structureScore = 48;
    conflictingFactors.push('Consolidation/Ranging market structure without confirmed impulse breakout');
  }

  // 3. Pattern Score
  let patternScore = 52;
  const activePattern = patterns[0];
  if (activePattern) {
    patternScore = activePattern.confidence;
    if (activePattern.direction === 'BULLISH') {
      confluenceFactors.push(`Pattern: ${activePattern.pattern} (${activePattern.confidence}% confidence)`);
    } else {
      conflictingFactors.push(`Pattern: ${activePattern.pattern} (${activePattern.confidence}% confidence)`);
    }
  }

  // 4. Momentum Score
  let momentumScore = 50;
  if (technical.adx.trendStrength === 'STRONG_TREND') {
    momentumScore = technical.adx.plusDi > technical.adx.minusDi ? 88 : 22;
    confluenceFactors.push(`ADX Strong Trend (${technical.adx.value})`);
  } else {
    momentumScore = technical.adx.plusDi > technical.adx.minusDi ? 65 : 40;
  }

  // 5. Risk Score
  let riskScore = 75;
  if (technical.atr14 > 0.0035) {
    riskScore -= 10;
    conflictingFactors.push('Elevated ATR volatility implies wider required invalidation');
  }

  // Composite Weighted Score
  // Weights: Technical (25%), Structure (30%), Pattern (20%), Momentum (15%), Risk (10%)
  const rawFinal = (
    technicalScore * 0.25 +
    structureScore * 0.30 +
    patternScore * 0.20 +
    momentumScore * 0.15 +
    riskScore * 0.10
  );
  const finalScore = Number(rawFinal.toFixed(1));

  let signal: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
  let strength: 'STRONG' | 'MODERATE' | 'WEAK' = 'WEAK';

  if (finalScore >= 72 && (structure.structure === 'BULLISH' || techBull > techBear + 1)) {
    signal = 'BUY';
    strength = finalScore >= 82 ? 'STRONG' : 'MODERATE';
  } else if (finalScore <= 45 || (structure.structure === 'BEARISH' && techBear > techBull)) {
    signal = 'SELL';
    const invertedScore = 100 - finalScore;
    strength = invertedScore >= 78 ? 'STRONG' : 'MODERATE';
  } else {
    signal = 'WAIT';
    strength = 'MODERATE';
  }

  return {
    symbol,
    timeframe,
    technicalScore,
    structureScore,
    patternScore,
    momentumScore,
    riskScore,
    finalScore,
    signal,
    strength,
    confluenceFactors: confluenceFactors.slice(0, 5),
    conflictingFactors: conflictingFactors.slice(0, 4),
    timestamp: new Date().toISOString()
  };
}

export function getPipMultiplier(symbol: string): { multiplier: number; unit: string } {
  const s = symbol.toUpperCase().replace('/', '_');
  if (s.includes('JPY')) return { multiplier: 100, unit: 'pips' };
  if (s.includes('XAU') || s.includes('GOLD')) return { multiplier: 10, unit: 'pips' };
  if (s.includes('BTC') || s.includes('ETH')) return { multiplier: 1, unit: 'pts' };
  return { multiplier: 10000, unit: 'pips' };
}

export function calculateRisk(
  currentPrice: number,
  signal: 'BUY' | 'SELL' | 'WAIT',
  atr: number,
  structure: MarketStructureDto,
  digits = 5,
  symbol = 'EUR_USD'
): RiskInfoDto {
  const safeAtr = atr > 0 ? atr : 0.0015;
  let entry = currentPrice;
  let stopLoss: number;
  let takeProfit1: number;
  let takeProfit2: number;

  if (signal === 'BUY') {
    // SL below swing low or 1.5 ATR
    const structuralLow = structure.recentLows.length > 0 ? structure.recentLows[structure.recentLows.length - 1].price : currentPrice - safeAtr * 1.5;
    stopLoss = Math.min(structuralLow, currentPrice - safeAtr * 1.2);
    const slDist = currentPrice - stopLoss;
    takeProfit1 = currentPrice + slDist * 1.6;
    takeProfit2 = currentPrice + slDist * 2.8;
  } else if (signal === 'SELL') {
    const structuralHigh = structure.recentHighs.length > 0 ? structure.recentHighs[structure.recentHighs.length - 1].price : currentPrice + safeAtr * 1.5;
    stopLoss = Math.max(structuralHigh, currentPrice + safeAtr * 1.2);
    const slDist = stopLoss - currentPrice;
    takeProfit1 = currentPrice - slDist * 1.6;
    takeProfit2 = currentPrice - slDist * 2.8;
  } else {
    stopLoss = currentPrice - safeAtr * 1.5;
    takeProfit1 = currentPrice + safeAtr * 2.0;
    takeProfit2 = currentPrice + safeAtr * 3.2;
  }

  const riskDist = Math.abs(currentPrice - stopLoss);
  const rewardDist = Math.abs(takeProfit1 - currentPrice);
  const rrRatio = riskDist > 0 ? Number((rewardDist / riskDist).toFixed(2)) : 1.6;

  // Exact Pip calculations
  const { multiplier, unit } = getPipMultiplier(symbol);
  const slPips = Number((riskDist * multiplier).toFixed(1));
  const tp1Pips = Number((rewardDist * multiplier).toFixed(1));
  const tp2Pips = Number((Math.abs(takeProfit2 - currentPrice) * multiplier).toFixed(1));

  // Standard institutional position size for 100k account risking 1% ($1000)
  const riskAmount = 1000;
  const recommendedUnits = riskDist > 0 ? Math.round(riskAmount / (riskDist * 10000)) * 1000 : 10000;

  return {
    currentPrice: Number(currentPrice.toFixed(digits)),
    entry: Number(entry.toFixed(digits)),
    stopLoss: Number(stopLoss.toFixed(digits)),
    takeProfit1: Number(takeProfit1.toFixed(digits)),
    takeProfit2: Number(takeProfit2.toFixed(digits)),
    riskRewardRatio: rrRatio,
    atrRiskPoints: Number(safeAtr.toFixed(digits)),
    recommendedPositionUnits: Math.max(1000, recommendedUnits),
    maxRiskPercent: 1.0,
    slPips,
    tp1Pips,
    tp2Pips,
    pipUnit: unit,
    invalidationRule: signal === 'BUY'
      ? `Invalidated on clean candle close below key support level ${stopLoss.toFixed(digits)}`
      : signal === 'SELL'
      ? `Invalidated on clean candle close above resistance level ${stopLoss.toFixed(digits)}`
      : 'Wait for directional break outside range bounds before committing capital'
  };
}
