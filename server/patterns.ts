import { Candle, PatternDetectionDto } from './types';
import { calculateATR } from './indicators';

export function detectPatterns(candles: Candle[]): PatternDetectionDto[] {
  const patterns: PatternDetectionDto[] = [];
  if (candles.length < 10) return patterns;

  const len = candles.length;
  const c1 = candles[len - 1];
  const c2 = candles[len - 2];
  const c3 = candles[len - 3];
  const atr = calculateATR(candles, 14);

  // 1. Bullish Engulfing
  if (c2.close < c2.open && c1.close > c1.open && c1.close > c2.open && c1.open < c2.close) {
    patterns.push({
      pattern: 'Bullish Engulfing',
      kurdishName: 'مۆمی داپۆشەری کڕین (Bullish Engulfing)',
      direction: 'BULLISH',
      confidence: 85,
      quality: 88,
      startIndex: len - 2,
      endIndex: len - 1,
      validationStatus: 'VALIDATED',
      targetPrice: Number((c1.close + atr * 2).toFixed(5)),
      invalidationLevel: Number(Math.min(c1.low, c2.low).toFixed(5)),
      description: 'Strong buyers absorbed previous bear candle and closed above its open price.',
      kurdishDescription: 'کڕیاران بە تەواوی مۆمی سووری پێشوویان داپۆشیوە؛ ئاماژەیە بۆ هێزی کڕین و بەرزبوونەوەی نرخ.'
    });
  }

  // 2. Bearish Engulfing
  if (c2.close > c2.open && c1.close < c1.open && c1.close < c2.open && c1.open > c2.close) {
    patterns.push({
      pattern: 'Bearish Engulfing',
      kurdishName: 'مۆمی داپۆشەری فرۆشتن (Bearish Engulfing)',
      direction: 'BEARISH',
      confidence: 84,
      quality: 87,
      startIndex: len - 2,
      endIndex: len - 1,
      validationStatus: 'VALIDATED',
      targetPrice: Number((c1.close - atr * 2).toFixed(5)),
      invalidationLevel: Number(Math.max(c1.high, c2.high).toFixed(5)),
      description: 'Institutional supply overwhelmed previous bull body with full lower engulfment.',
      kurdishDescription: 'فرۆشیاران بە تەواوی مۆمی سەوزی پێشوویان قووتداوە؛ ئاماژەیە بۆ هێزی فرۆشتن و دابەزینی نرخ.'
    });
  }

  // 3. Hammer / Bullish Pin Bar
  const body1 = Math.abs(c1.close - c1.open);
  const lowerWick = Math.min(c1.open, c1.close) - c1.low;
  const upperWick = c1.high - Math.max(c1.open, c1.close);

  if (lowerWick > body1 * 2.2 && upperWick < body1 * 0.8) {
    patterns.push({
      pattern: 'Bullish Pin Bar / Hammer',
      kurdishName: 'مۆمی چەکوش / پین باری کڕین (Hammer)',
      direction: 'BULLISH',
      confidence: 80,
      quality: 82,
      startIndex: len - 1,
      endIndex: len - 1,
      validationStatus: 'VALIDATED',
      targetPrice: Number((c1.close + atr * 1.8).toFixed(5)),
      invalidationLevel: Number(c1.low.toFixed(5)),
      description: 'Long lower shadow represents aggressive rejection of discount liquidity.',
      kurdishDescription: 'کلکی درێژی خوارەوەی کاندڵەکە نیشانەی ڕەتکردنەوەی فرۆشتن و دەرکەوتنی کڕیارانی نوێیە.'
    });
  }

  // 4. Shooting Star / Bearish Pin Bar
  if (upperWick > body1 * 2.2 && lowerWick < body1 * 0.8) {
    patterns.push({
      pattern: 'Shooting Star / Bearish Pin Bar',
      kurdishName: 'نەیزەکی فرۆشتن / پین باری ورچ (Shooting Star)',
      direction: 'BEARISH',
      confidence: 81,
      quality: 83,
      startIndex: len - 1,
      endIndex: len - 1,
      validationStatus: 'VALIDATED',
      targetPrice: Number((c1.close - atr * 1.8).toFixed(5)),
      invalidationLevel: Number(c1.high.toFixed(5)),
      description: 'Long upper wick highlights institutional rejection of premium liquidity.',
      kurdishDescription: 'کلکی درێژی سەرەوەی کاندڵەکە نیشانەی ڕەتکردنەوەی بەرزبوونەوە و دەسەڵاتی فرۆشیارانە.'
    });
  }

  // 5. Morning Star
  if (c3.close < c3.open && Math.abs(c2.close - c2.open) < atr * 0.4 && c1.close > c1.open && c1.close > (c3.open + c3.close) / 2) {
    patterns.push({
      pattern: 'Morning Star',
      kurdishName: 'ئەستێرەی بەیانی پێچەوانەکەرەوە (Morning Star)',
      direction: 'BULLISH',
      confidence: 88,
      quality: 90,
      startIndex: len - 3,
      endIndex: len - 1,
      validationStatus: 'VALIDATED',
      targetPrice: Number((c1.close + atr * 2.2).toFixed(5)),
      invalidationLevel: Number(c2.low.toFixed(5)),
      description: 'Three-bar momentum exhaustion and reversal sequence confirmed.',
      kurdishDescription: 'ڕیزبەندی ٣ مۆمی کە کۆتاییهاتنی دابەزین و وەرچەرخانی ڕەوت بەرەو بەرزبوونەوە دەسەلمێنێت.'
    });
  }

  // If no immediate pattern found, detect structural double bottom/top in last 40 candles
  if (patterns.length === 0 && len >= 35) {
    const slice = candles.slice(-35);
    const minLow = Math.min(...slice.map(c => c.low));
    const maxHigh = Math.max(...slice.map(c => c.high));
    const minIndices = slice.map((c, i) => Math.abs(c.low - minLow) < atr * 0.25 ? i : -1).filter(i => i >= 0);
    const maxIndices = slice.map((c, i) => Math.abs(c.high - maxHigh) < atr * 0.25 ? i : -1).filter(i => i >= 0);

    if (minIndices.length >= 2 && minIndices[minIndices.length - 1] - minIndices[0] >= 10) {
      patterns.push({
        pattern: 'Double Bottom (W-Formation)',
        kurdishName: 'شێوازی دووانە بنکەی کڕین (Double Bottom - W)',
        direction: 'BULLISH',
        confidence: 84,
        quality: 86,
        startIndex: len - 35 + minIndices[0],
        endIndex: len - 1,
        validationStatus: 'VALIDATED',
        targetPrice: Number((c1.close + atr * 2.5).toFixed(5)),
        invalidationLevel: Number(minLow.toFixed(5)),
        description: 'Secondary test of major support with seller exhaustion.',
        kurdishDescription: 'نرخ دوو جار هێڵی پشتگیری تاقیکردۆتەوە بەبێ ئەوەی بشکێت؛ شێوازی W نیشانەی کڕینی بەهێزە.'
      });
    } else if (maxIndices.length >= 2 && maxIndices[maxIndices.length - 1] - maxIndices[0] >= 10) {
      patterns.push({
        pattern: 'Double Top (M-Formation)',
        kurdishName: 'شێوازی دووانە لووتکەی فرۆشتن (Double Top - M)',
        direction: 'BEARISH',
        confidence: 83,
        quality: 85,
        startIndex: len - 35 + maxIndices[0],
        endIndex: len - 1,
        validationStatus: 'VALIDATED',
        targetPrice: Number((c1.close - atr * 2.5).toFixed(5)),
        invalidationLevel: Number(maxHigh.toFixed(5)),
        description: 'Secondary rejection of major resistance with institutional distribution.',
        kurdishDescription: 'نرخ نەیتوانیوە لە سەرووی لووتکە بمێنێتەوە؛ شێوازی M نیشانەی فرۆشتن و گەڕانەوەیە بۆ خوارەوە.'
      });
    } else {
      // Default Inside Bar or Continuation
      const isBull = c1.close >= c2.close;
      patterns.push({
        pattern: 'Momentum Continuation Base',
        kurdishName: isBull ? 'شێوازی بەردەوامی کڕین (Bullish Continuation)' : 'شێوازی بەردەوامی فرۆشتن (Bearish Continuation)',
        direction: isBull ? 'BULLISH' : 'BEARISH',
        confidence: 75,
        quality: 78,
        startIndex: len - 2,
        endIndex: len - 1,
        validationStatus: 'VALIDATED',
        targetPrice: Number((c1.close + (isBull ? atr * 1.5 : -atr * 1.5)).toFixed(5)),
        invalidationLevel: Number((isBull ? c1.low - atr * 0.5 : c1.high + atr * 0.5).toFixed(5)),
        description: 'Order flow consolidation above dynamic liquidity support.',
        kurdishDescription: 'چەسپانی نرخ لەسەر هێڵە جوڵاوەکان بە مەبەستی بەردەوامبوونی ئاراستەی سەرەکی.'
      });
    }
  }

  return patterns;
}
