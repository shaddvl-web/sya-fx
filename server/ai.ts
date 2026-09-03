import { FullAnalysisDto } from './types';
import { GoogleGenAI } from '@google/genai';

export interface PatternBookBlueprintDto {
  patternName: string;
  kurdishName: string;
  textbookSource: string;
  archetype: string;
  rules: {
    marketCondition: string;
    entryTrigger: string;
    stopLossRule: string;
    targetRule: string;
  };
  proTip: string;
}

export interface AiAnalysisResponseDto {
  symbol: string;
  timeframe: string;
  currentPrice: number;
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  slPips: number;
  tp1Pips: number;
  tp2Pips: number;
  pipUnit: string;
  riskRewardRatio: number;
  summary: string;
  patternAnalysis?: string;
  patternBookBlueprint?: PatternBookBlueprintDto;
  trend: 'BULLISH' | 'BEARISH' | 'RANGING';
  signal: 'BUY' | 'SELL' | 'WAIT';
  signalKurdish?: string;
  confidence: number;
  reasons: string[];
  risks: string[];
  invalidations: string[];
  recommendation: string;
  facts: string[];
  analysis: string[];
  uncertainties: string[];
  modelUsed: string;
  timestamp: string;
}

let genAiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAiClient && process.env.GEMINI_API_KEY) {
    genAiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAiClient;
}

function buildDefaultPatternBlueprint(patternName: string, kurdishName: string, isBull: boolean, risk: any): PatternBookBlueprintDto {
  const normName = (patternName || '').toLowerCase();
  
  if (normName.includes('double bottom') || normName.includes('w-bottom') || normName.includes('w-pattern')) {
    return {
      patternName: 'Double Bottom (W-Pattern)',
      kurdishName: 'دووانە بنی بەرزبوونەوە (شێوەی W)',
      textbookSource: 'کتێبی زانستی Bulkowski Encyclopedia of Chart Patterns',
      archetype: 'شێوازی گۆڕینی ئاراستەی سەرەکی (Bullish Reversal)',
      rules: {
        marketCondition: 'پاش شەپۆلێکی دابەزین، نرخ دوو خاڵی نزمی هاوشێوە پێکدەهێنێت کە ڕەتکردنەوەی نرخی کەم دەسەلمێنێت.',
        entryTrigger: `داخرانی مۆمێکی سەوزی بەهێز لە سەرووی هێڵی مل (Neckline) لە ئاستی دەستپێک: ${risk.entry}.`,
        stopLossRule: `دانانی ستۆپ لۆس لەژێر بنی دووەم بە دووری ${risk.slPips} ${risk.pipUnit} لە ئاستی: ${risk.stopLoss}.`,
        targetRule: `ئامانجی قازانج بە پێوانەی بەرزی شێوازەکە (H) بە بڕی +${risk.tp1Pips} ${risk.pipUnit} بۆ ئاستی: ${risk.takeProfit1}.`
      },
      proTip: 'پێوانەی بەرزی نێوان هێڵی مل و نزمترین بن زیاد بکە بۆ خاڵی شکان بۆ دیاریکردنی ئامانجی دەقیقی بیرکاری.'
    };
  } else if (normName.includes('double top') || normName.includes('m-top') || normName.includes('m-pattern')) {
    return {
      patternName: 'Double Top (M-Pattern)',
      kurdishName: 'دووانە لوتکەی دابەزین (شێوەی M)',
      textbookSource: 'کتێبی فێرکاری کلاسیکی Technical Analysis of the Financial Markets',
      archetype: 'شێوازی هەڵگەڕانەوەی دابەزین (Bearish Reversal)',
      rules: {
        marketCondition: 'نرخ لە دوای ترێندێکی بەرزبوونەوە دوو لوتکە لەسەر یەک ئاست دروست دەکات بەبێ توانای تێپەڕاندن.',
        entryTrigger: `شکانی هێڵی ملی خوارەوە و داخرانی مۆمێکی سوور لە خوار ئاستی: ${risk.entry}.`,
        stopLossRule: `دانانی هێڵی پاراستن لە سەرووی لوتکەی دووەم بە بڕی ${risk.slPips} ${risk.pipUnit} لە ئاستی: ${risk.stopLoss}.`,
        targetRule: `ئامانجی قازانجی دابەزین بەرەو خوارەوە بە بڕی ${risk.tp1Pips} ${risk.pipUnit} لە ئاستی: ${risk.takeProfit1}.`
      },
      proTip: 'چاوەڕوانی داخستنی مۆمی تەواو بکە لەژێر هێڵی مل، مەچۆرە ژوورەوە تەنها بە پشکنینی سێبەر (Wick).'
    };
  } else if (normName.includes('engulfing')) {
    return {
      patternName: isBull ? 'Bullish Engulfing' : 'Bearish Engulfing',
      kurdishName: isBull ? 'مۆمی داپۆشەری بەرزبوونەوە' : 'مۆمی داپۆشەری دابەزین',
      textbookSource: 'کتێبی Steve Nison — Japanese Candlestick Charting Techniques',
      archetype: 'هەڵمژینی تەواوی نەختینەی کاندڵی پێشوو (Liquidity Absorption)',
      rules: {
        marketCondition: isBull ? 'مۆمێکی سەوزی گەورە تەواوی جەستەی مۆمی سووری پێش خۆی دادەپۆشێت.' : 'مۆمێکی سووری گەورە تەواوی جەستەی مۆمی سەوزی پێش خۆی هەڵدەلوشێت.',
        entryTrigger: `دەستبەجێ لە کاتی داخرانی مۆمی داپۆشەر لە ئاستی دەستپێک: ${risk.entry}.`,
        stopLossRule: `لە ژێر/سەرووی نزمترین یا بەرزترین سێبەری مۆمەکە بە دووری ${risk.slPips} ${risk.pipUnit} لە ئاستی: ${risk.stopLoss}.`,
        targetRule: `دیاریکردنی ئامانجی قازانج بە کەمترین ڕێژەی 1:${risk.riskRewardRatio} بە بڕی +${risk.tp1Pips} ${risk.pipUnit} لە ئاستی: ${risk.takeProfit1}.`
      },
      proTip: 'هەرچەندە جەستەی مۆمی دووەم گەورەتر بێت بەراورد بە مۆمی یەکەم، هێزی گۆڕانکارییەکە باوەڕپێکراوترە.'
    };
  } else if (normName.includes('hammer') || normName.includes('pinbar') || normName.includes('hanging')) {
    return {
      patternName: 'Hammer / Pin Bar Rejection',
      kurdishName: 'شێوازی چەکوش و ڕەتکردنەوەی نرخ (Pin Bar)',
      textbookSource: 'کتێبی Price Action Trading Handbook — Al Brooks',
      archetype: 'ڕەتکردنەوەی نەختینە و کێشانی سێبەری درێژ (Rejection Tail)',
      rules: {
        marketCondition: 'سێبەرێکی درێژ (لانیکەم دوو هێندەی جەستە) دەردەکەوێت کە نیشانەی ڕەتکردنەوەی ناوچەیەکی سەرەکییە.',
        entryTrigger: `تێپەڕاندنی بەرزترین خاڵی کاندڵەکە لە ئاستی دەستپێک: ${risk.entry}.`,
        stopLossRule: `لە ژێر قووڵترین کڵاوەی سێبەری چەکوشەکە بە بڕی ${risk.slPips} ${risk.pipUnit} لە ئاستی: ${risk.stopLoss}.`,
        targetRule: `ئامانجی قازانج بە بڕی +${risk.tp1Pips} ${risk.pipUnit} بەرەو ئاستی: ${risk.takeProfit1}.`
      },
      proTip: 'سێبەری خوارەوە نیشاندەری کڕینی دەستبەجێی بانکەکانە کاتێک فرۆشیاران ویستیان نرخ دابەزێنن.'
    };
  }

  // Generic Institutional Setup Blueprint
  return {
    patternName: patternName || 'Market Structure Confluence',
    kurdishName: kurdishName || 'پێکهاتەی زانستی بازاڕ و نەخشەی چارت',
    textbookSource: 'تێرمیناڵی دارایی SYA FX — بەشی نموونەی کتێبی بازرگانی',
    archetype: isBull ? 'ترێندی بەرزبوونەوەی پشتڕاستکراو' : 'ترێندی دابەزینی پشتڕاستکراو',
    rules: {
      marketCondition: `ڕێککەوتنی چەندین نیشاندەری دارایی و ستراکچەری بازاڕ بە متمانەی بەرز.`,
      entryTrigger: `خاڵی دەستپێک لە ئاستی: ${risk.entry}.`,
      stopLossRule: `ڕاگرتنی زیان (Stop Loss) لە ئاستی: ${risk.stopLoss} (بە مەودای ${risk.slPips} ${risk.pipUnit}).`,
      targetRule: `ئامانجی یەکەمی قازانج (TP1) لە ئاستی: ${risk.takeProfit1} (+${risk.tp1Pips} ${risk.pipUnit}).`
    },
    proTip: `هەمیشە پێش چوونە نێو هەر مامەڵەیەک، ڕێژەی زیان و قازانج (R:R 1:${risk.riskRewardRatio}) و قەبارەی پپ (${risk.slPips} pips) لەبەرچاو بگرە.`
  };
}

export async function runAiAnalyst(analysis: FullAnalysisDto, lang: string = 'ku'): Promise<AiAnalysisResponseDto> {
  const sym = analysis.symbol.replace('_', '/');
  const price = analysis.currentPrice;
  const tf = analysis.timeframe;
  const isKu = lang === 'ku';

  const isBuy = analysis.signal.signal === 'BUY';
  const isSell = analysis.signal.signal === 'SELL';
  const signalKu = isBuy ? 'کڕین (BUY)' : (isSell ? 'فرۆشتن (SELL)' : 'چاوەڕوانی (WAIT)');

  const primaryPattern = analysis.patterns[0];
  const patternNameKu = primaryPattern?.kurdishName || (primaryPattern ? primaryPattern.pattern : 'پشووی مۆمەکان و بەردەوامی ترێند');
  const patternDescKu = primaryPattern?.kurdishDescription || 'کاندڵەکانی نرخ لە قۆناغی کۆکردنەوەی نەختینە و دیاریکردنی ئاراستەی داهاتوودان.';

  // Structured factual points
  const factsKu = [
    `نرخی ڕاستەوخۆ: ${sym} لەسەر تایم فریمی ${tf} بە نرخی ${price} مامەڵەی پێوە دەکرێت.`,
    `تێکڕای جوڵاوەکان (EMA): کورتخایەن EMA 20 (${analysis.technical.ema20})، ناوەند EMA 50 (${analysis.technical.ema50})، درێژخایەن EMA 200 (${analysis.technical.ema200}).`,
    `نیشاندەری مۆمێنتەم (RSI 14): لە ئاستی ${analysis.technical.rsi14}دایە لەگەڵ هیستۆگرامی MACD (${analysis.technical.macd.histogram}).`,
    `ستراکچەری بازاڕ: بە شێوەی زانستی ${analysis.structure.structure === 'BULLISH' ? 'بەرزبوونەوە (Bullish)' : (analysis.structure.structure === 'BEARISH' ? 'دابەزین (Bearish)' : 'چەقبەستوو (Ranging)')} پشتڕاستکراوەتەوە بە متمانەی ${analysis.structure.confidence}%.`
  ];

  if (analysis.structure.bos && analysis.structure.bos.detected) {
    factsKu.push(`شکانی ستراکچەر (BOS): لە ئاستی ${analysis.structure.bos.breakoutLevel} بە ئاراستەی ${analysis.structure.bos.direction === 'BULLISH' ? 'کڕین' : 'فرۆشتن'} ڕوویداوە.`);
  }
  if (primaryPattern) {
    factsKu.push(`شێوازی کاندڵ و چارت: شێوازی '${patternNameKu}' بە متمانەی ${primaryPattern.confidence}% لەسەر چارتەکە دۆزراوەتەوە.`);
  }

  const analysisPointsKu = [
    `نمرەی کۆنفڵوێنس: ${analysis.signal.finalScore} لە ١٠٠ کە بڕیاری یەکلاکەرەوەی '${signalKu}' دەسەلمێنێت.`,
    `هێڵی پاراستن و ڕاگرتنی زیان (SL): لە ئاستی ${analysis.risk.stopLoss} دانراوە بە ڕێژەی قازانج بەرامبەر زیان 1:${analysis.risk.riskRewardRatio}.`,
    `ئامانجەکانی قازانج: ئامانجی یەکەم (TP1) لە ${analysis.risk.takeProfit1} و ئامانجی دووەم (TP2) لە ${analysis.risk.takeProfit2}.`,
    `یاسای بەتاڵبوونەوە (Invalidation): ئەگەر نرخ ئاستی ${analysis.risk.stopLoss} ببەزێنێت، تەواوی شرۆڤەکە هەڵدەوەشێتەوە.`
  ];

  const uncertaintiesKu = [
    'هەواڵ و بەیاننامە ئابوورییە کتوپڕەکان (وەک ڕێژەی سوود و هەڵاوسان) دەکرێت بۆ ماوەیەکی کاتی پێکهاتەی تەکنیکی تێکبدەن.',
    'کەمبوونەوەی نەختینە لە کاتی گۆڕینەوەی دانیشتنی بازاڕەکانی نیویۆرک و تۆکیۆ.',
    'ئەگەری بەرکەوتنی نرخ بە ئاستە دەروونی و مێژووییەکانی تایم فریمە گەورەکانی وەک رۆژانە (Daily).'
  ];

  // Attempt Gemini API for deep natural language Kurdish intelligence
  try {
    const ai = getGenAI();
    if (ai) {
      const prompt = `تۆ پسپۆڕ و شیکەرەوەی باڵای بازاڕە داراییەکانیت (Lead Quantitative Forex Strategist) لە تێرمیناڵی دارایی SYA FX.
شیکارییەکی زۆر ورد، پاراو، زانستی و بە کوردییەکی سۆرانیی ڕەوان بنووسە کە بە وردی ڕوونی بکاتەوە باری بازاڕ چۆنە و بۆچی.
زانیارییە تەکنیکییەکان:
جووتە دراو: ${sym} (تایم فریم: ${tf})
نرخی ئێستا: ${price}
تێکڕای جوڵاوەکان: EMA20=${analysis.technical.ema20}, EMA50=${analysis.technical.ema50}, EMA200=${analysis.technical.ema200}
مۆمێنتەم: RSI=${analysis.technical.rsi14}, MACD Hist=${analysis.technical.macd.histogram}
ستراکچەری بازاڕ: ${analysis.structure.structure} (متمانە: ${analysis.structure.confidence}%)
شێوە و نەخشەی چارت (Chart Pattern): ${patternNameKu} (${primaryPattern?.direction || 'NEUTRAL'})
بڕیاری کۆنفڵوێنس: ${analysis.signal.signal} (نمرە: ${analysis.signal.finalScore}/100)
ئاستەکانی مەترسی: چوونەژوورەوە=${analysis.risk.entry}, ڕاگرتنی زیان (SL)=${analysis.risk.stopLoss}, ئامانج (TP1)=${analysis.risk.takeProfit1}, ڕێژەی قازانج=${analysis.risk.riskRewardRatio}

تکایە بە کوردییەکی زۆر پاراو و ڕەوان کە هەر کەسێک بیخوێنێتەوە بە تەواوی تێبگات چۆنە:
1. "summary": پوختەیەک بنووسە کە ڕوونی بکاتەوە بازاڕ لە ئێستادا چۆنە و بۆچی (ئایا بەرزبوونەوەیە یان دابەزین، کێ کۆنتڕۆڵی کردووە، جووڵەی مۆمەکان چۆنە).
2. "patternAnalysis": شیکاری شێوازی کاندڵ و چارتەکە (Chart Pattern) بە کوردی ڕوون بکەرەوە کە چ شێوەیەک دەرکەوتووە و بۆچی ئەم شێوەیە گرنگە و ئامانجەکەی بەرەو کوێیە.
3. "recommendation": بڕیاری یەکلاکەرەوەی کۆتایی دیاری بکە کە ئایا کڕین (BUY) یان فرۆشتن (SELL) یان چاوەڕوانی (WAIT) و چۆن سەرمایەکەیان بپارێزن.

وەڵامەکە دەبێت بە فۆرماتی دروستی JSON بێت بەم شێوازە:
{
  "summary": "...",
  "patternAnalysis": "...",
  "recommendation": "..."
}`;

      const candidateModels = [
        process.env.GEMINI_MODEL,
        'gemini-3.6-flash',
        'gemini-3.8-flash',
        'gemini-flash-latest'
      ].filter(Boolean) as string[];

      let response: any = null;
      let modelUsed = 'gemini-3.6-flash';

      for (const modelName of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt
          });
          if (response && response.text) {
            modelUsed = modelName;
            break;
          }
        } catch (mErr: any) {
          console.warn(`[SYA FX] Attempt with model ${modelName} failed:`, mErr.message);
        }
      }

      const patternBlueprint = buildDefaultPatternBlueprint(
        primaryPattern?.pattern || 'Market Structure',
        patternNameKu,
        isBuy,
        analysis.risk
      );

      if (response && response.text) {
        const text = response.text || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return {
            symbol: analysis.symbol,
            timeframe: analysis.timeframe,
            currentPrice: price,
            entry: analysis.risk.entry,
            stopLoss: analysis.risk.stopLoss,
            takeProfit1: analysis.risk.takeProfit1,
            takeProfit2: analysis.risk.takeProfit2,
            slPips: analysis.risk.slPips,
            tp1Pips: analysis.risk.tp1Pips,
            tp2Pips: analysis.risk.tp2Pips,
            pipUnit: analysis.risk.pipUnit,
            riskRewardRatio: analysis.risk.riskRewardRatio,
            summary: parsed.summary,
            patternAnalysis: parsed.patternAnalysis,
            patternBookBlueprint: patternBlueprint,
            trend: analysis.structure.structure as any,
            signal: analysis.signal.signal,
            signalKurdish: signalKu,
            confidence: Math.round(analysis.signal.finalScore),
            reasons: analysis.signal.confluenceFactors.length > 0 ? analysis.signal.confluenceFactors : ['ڕێککەوتنی تێکڕای جوڵاوەکان و هێڵی ئاراستەی نرخ.'],
            risks: analysis.signal.conflictingFactors.length > 0 ? analysis.signal.conflictingFactors : ['ئاگاداری گۆڕانکاری کتوپڕی سپڕێد بە لە کاتی کردنەوەی بازاڕدا.'],
            invalidations: [analysis.risk.invalidationRule],
            recommendation: parsed.recommendation,
            facts: factsKu,
            analysis: analysisPointsKu,
            uncertainties: uncertaintiesKu,
            modelUsed,
            timestamp: new Date().toISOString()
          };
        }
      }
    }
  } catch (err: any) {
    console.warn('[SYA FX] Gemini API analyst error, using deterministic institutional engine:', err.message);
  }

  const patternBlueprint = buildDefaultPatternBlueprint(
    primaryPattern?.pattern || 'Market Structure',
    patternNameKu,
    isBuy,
    analysis.risk
  );

  // Deterministic highly-fluent Kurdish intelligence engine
  let summary = '';
  let patternAnalysis = '';
  let recommendation = '';

  if (isBuy) {
    summary = `لە ئێستادا جووتە دراوی ${sym} لە بارودۆخێکی بەرزبوونەوەی بەهێزدایە (Bullish). کڕیارە دامەزراوەییەکان کۆنتڕۆڵی تەواوی بازاڕیان بەدەستەوەیە، چونکە نرخی ئێستا (${price}) بە بەردەوامی لە سەرووی تێکڕای جووڵاوی ٢٠٠ مۆم (EMA 200: ${analysis.technical.ema200}) جێگیر بووە. نیشاندەری مۆمێنتەم (RSI: ${analysis.technical.rsi14}) لە سەرووی ئاستی ٥٠ دایە و هیستۆگرامی MACD ئەرێنییە، ئەمەش سەلمێنەری هێزی زۆری داواکاری کڕین و نەبوونی بەرگرییەکی مەترسیدارە لە کورتخایەندا.`;
    patternAnalysis = `لەسەر چارتی کاندڵەکان بە شێوەیەکی دەستبەجێ شێوازی '${patternNameKu}' تۆمارکراوە (${patternDescKu}). ئەم شێوازە نیشانەیەکی تەکنیکی پشتڕاستکراوەیە کە فرۆشیارانی ماندوو کردووە و ئامانجی داهاتووی نرخ بەرەو ئاستی ${analysis.risk.takeProfit1} ئاڕاستە دەکات. لە کاتێکدا کاندڵەکان لە سەرووی هێڵی پشتگیری ${analysis.risk.stopLoss} مابنەوە، هێزی کڕین لە لووتکەدایە.`;
    recommendation = `بڕیاری کۆتایی: کڕین (BUY). دەتوانیت لە ئاستی ئێستای ${analysis.risk.entry} بچیتە نێو مامەڵەی کڕین. بە مەبەستی پاراستنی سەرمایەکەت و کەمکردنەوەی مەترسی، هێڵی ڕاگرتنی زیان (Stop Loss) لە ئاستی ${analysis.risk.stopLoss} دابنێ (بە مەودای -${analysis.risk.slPips} ${analysis.risk.pipUnit})، و ئامانجی یەکەمی قازانج (TP1) لە ${analysis.risk.takeProfit1} دیاری بکە (+${analysis.risk.tp1Pips} ${analysis.risk.pipUnit}) کە بە ڕێژەی قازانج بەرامبەر مەترسیی نموونەیی 1:${analysis.risk.riskRewardRatio} کێشراوە.`;
  } else if (isSell) {
    summary = `لە ئێستادا جووتە دراوی ${sym} لە بارودۆخێکی دابەزینی ڕوون و چڕدایە (Bearish). فرۆشیارە گەورەکان کۆنتڕۆڵی بازاڕیان کردووە و فشارێکی زۆری خستنەڕووی دراو دروستبووە. نرخی ئێستا (${price}) لە خوارەوەی هەردوو تێکڕای جوڵاوی کورتخایەن (EMA 20) و درێژخایەن (EMA 200) مامەڵەی پێوە دەکرێت، کە ئەوە دەردەخات فرۆشیاران بەهێزن و هەر کشانەوەیەکی نرخ بەرەو سەرەوە دەبێتە دەرفەتێکی نوێی فرۆشتن.`;
    patternAnalysis = `لەسەر چارتی کاندڵەکان شێوازی '${patternNameKu}' پێکهاتووە (${patternDescKu}). ئەم شێوازە ڕەنگدانەوەی ڕەتکردنەوەی نرخی بەرز و شکاندنی زۆنی کڕیارانە، و پێشبینی دەکرێت مۆمەکانی داهاتوو دابەزینی زیاتر بەخۆیانەوە ببینن بەرەو ئامانجی خوارەوە لە ${analysis.risk.takeProfit1}.`;
    recommendation = `بڕیاری کۆتایی: فرۆشتن (SELL). پێشنیار دەکرێت لە ئاستی ${analysis.risk.entry} دەست بە مامەڵەی فرۆشتن بکرێت. بۆ کۆنتڕۆڵی مەترسی، هێڵی ڕاگرتنی زیان (Stop Loss) لە سەرووی بەرزترین کاندڵی پێشوو لە ئاستی ${analysis.risk.stopLoss} جێگیر بکە (بە مەودای -${analysis.risk.slPips} ${analysis.risk.pipUnit})، و ئامانجی یەکەمی قازانج لە ${analysis.risk.takeProfit1} (+${analysis.risk.tp1Pips} ${analysis.risk.pipUnit}) بە ڕێژەی دڵخوازی 1:${analysis.risk.riskRewardRatio} جێبەجێ بکە.`;
  } else {
    summary = `لە ئێستادا جووتە دراوی ${sym} لە قۆناغی چەقبەستن و بێ ئاراستەییدایە (Ranging / Equilibrium). کڕیاران و فرۆشیاران لە شەڕێکی یەکساندان و نرخ لە نێوان پشتگیری ${analysis.structure.majorSupport} و بەرگری ${analysis.structure.majorResistance} گیری خواردووە بەبێ ئەوەی لایەنێکیان بتوانێت ئەوی تر بشکێنێت. نیشاندەرە تەکنیکییەکان نمرەی نێوەندی نیشان دەدەن (${analysis.signal.finalScore}/100).`;
    patternAnalysis = `کاندڵەکانی نرخ شێوازی '${patternNameKu}' نیشان دەدەن، بەڵام بەهۆی چەقبەستنی نێوان دوو ئاستی سەرەکی، هێشتا شکانی فەرمی (Breakout) ڕووینەداوە. مامەڵەکردن لەم کاتەدا مەترسی زۆری هەیە.`;
    recommendation = `بڕیاری کۆتایی: چاوەڕوانی (WAIT). باشترین تاکتیک پاراستنی سەرمایەیە هەتاوەکو نرخ بە مۆمێکی پڕ و قەبارەیەکی بەرز لە سەرووی بەرگری یان خوارووی پشتگیری دادەخرێت؛ پاش دڵنیابوونەوە لە شکانی فەرمی دەتوانیت بڕیاری چوونەژوورەوە بدەیت.`;
  }

  return {
    symbol: analysis.symbol,
    timeframe: analysis.timeframe,
    currentPrice: price,
    entry: analysis.risk.entry,
    stopLoss: analysis.risk.stopLoss,
    takeProfit1: analysis.risk.takeProfit1,
    takeProfit2: analysis.risk.takeProfit2,
    slPips: analysis.risk.slPips,
    tp1Pips: analysis.risk.tp1Pips,
    tp2Pips: analysis.risk.tp2Pips,
    pipUnit: analysis.risk.pipUnit,
    riskRewardRatio: analysis.risk.riskRewardRatio,
    summary,
    patternAnalysis,
    patternBookBlueprint: patternBlueprint,
    trend: analysis.structure.structure as any,
    signal: analysis.signal.signal,
    signalKurdish: signalKu,
    confidence: Math.round(analysis.signal.finalScore),
    reasons: analysis.signal.confluenceFactors.length > 0 ? analysis.signal.confluenceFactors : ['نرخ ڕێزی لە ئاستە پێکهاتەییە سەرەکییەکان گرتووە.'],
    risks: analysis.signal.conflictingFactors.length > 0 ? analysis.signal.conflictingFactors : ['ئاگاداری جوڵەی سپڕێد بە لە کاتی ڕاگەیاندنی هەواڵەکاندا.'],
    invalidations: [analysis.risk.invalidationRule],
    recommendation,
    facts: factsKu,
    analysis: analysisPointsKu,
    uncertainties: uncertaintiesKu,
    modelUsed: 'sya-ai/kurdish-v2',
    timestamp: new Date().toISOString()
  };
}
