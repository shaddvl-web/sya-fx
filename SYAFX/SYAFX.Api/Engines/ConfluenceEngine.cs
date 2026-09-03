using SYAFX.Api.DTOs;
using SYAFX.Api.Models;

namespace SYAFX.Api.Engines;

public class ConfluenceEngine
{
    public static ConfluenceSignalDto Evaluate(
        string symbol,
        string timeframe,
        IReadOnlyList<Candle> candles,
        TechnicalAnalysisDto technical,
        MarketStructureDto structure,
        List<PatternDetectionDto> patterns)
    {
        if (candles == null || candles.Count < 20)
        {
            return new ConfluenceSignalDto
            {
                Symbol = symbol,
                Timeframe = timeframe,
                Signal = "WAIT",
                Strength = "WEAK",
                FinalScore = 50,
                Timestamp = DateTime.UtcNow,
                ConflictingFactors = new List<string> { "Insufficient market data history." }
            };
        }

        var confluenceFactors = new List<string>();
        var conflictingFactors = new List<string>();

        // 1. Technical Score (0 - 100)
        decimal techScore = 50m;
        int techBull = 0;
        int techBear = 0;

        decimal close = candles[^1].Close;
        if (close > technical.Ema200) { techBull += 2; confluenceFactors.Add($"Price above 200 EMA ({technical.Ema200:F5})"); }
        else { techBear += 2; conflictingFactors.Add($"Price below 200 EMA ({technical.Ema200:F5})"); }

        if (technical.Ema20 > technical.Ema50) { techBull++; confluenceFactors.Add("EMA 20/50 Bullish Alignment"); }
        else { techBear++; conflictingFactors.Add("EMA 20/50 Bearish Alignment"); }

        if (technical.Macd.Histogram > 0) { techBull++; confluenceFactors.Add("MACD Histogram Positive"); }
        else { techBear++; conflictingFactors.Add("MACD Histogram Negative"); }

        if (technical.Rsi14 > 50 && technical.Rsi14 < 68) { techBull++; confluenceFactors.Add($"RSI bullish healthy range ({technical.Rsi14:F1})"); }
        else if (technical.Rsi14 < 50 && technical.Rsi14 > 32) { techBear++; conflictingFactors.Add($"RSI bearish healthy range ({technical.Rsi14:F1})"); }
        else if (technical.Rsi14 >= 70) { techBear++; conflictingFactors.Add($"RSI Overbought ({technical.Rsi14:F1})"); }
        else if (technical.Rsi14 <= 30) { techBull++; confluenceFactors.Add($"RSI Oversold bounce potential ({technical.Rsi14:F1})"); }

        techScore = Math.Clamp(50m + ((techBull - techBear) * 9m), 15m, 95m);

        // 2. Structure Score (0 - 100)
        decimal structScore = 50m;
        if (structure.Structure == "BULLISH")
        {
            structScore = Math.Max(70m, structure.Confidence);
            confluenceFactors.Add($"Bullish Market Structure (HH/HL confirmed, {structure.Confidence:F0}% confidence)");
            if (structure.Bos != null && structure.Bos.Direction == "BULLISH")
            {
                structScore = Math.Min(96m, structScore + 8m);
                confluenceFactors.Add("Confirmed Bullish Break of Structure (BOS)");
            }
        }
        else if (structure.Structure == "BEARISH")
        {
            structScore = Math.Max(70m, structure.Confidence);
            conflictingFactors.Add($"Bearish Market Structure (LH/LL confirmed, {structure.Confidence:F0}% confidence)");
            if (structure.Bos != null && structure.Bos.Direction == "BEARISH")
            {
                structScore = Math.Min(96m, structScore + 8m);
                conflictingFactors.Add("Confirmed Bearish Break of Structure (BOS)");
            }
        }
        else
        {
            structScore = 48m;
            conflictingFactors.Add("Ranging consolidation structure - no trend dominance");
        }

        // 3. Pattern Score (0 - 100)
        decimal patternScore = 50m;
        var activePattern = patterns.OrderByDescending(p => p.Quality).FirstOrDefault();
        if (activePattern != null)
        {
            patternScore = activePattern.Confidence;
            if (activePattern.Direction == "BULLISH")
            {
                confluenceFactors.Add($"Detected {activePattern.Pattern} ({activePattern.ValidationStatus}, {activePattern.Confidence:F0}% conf)");
            }
            else
            {
                conflictingFactors.Add($"Detected {activePattern.Pattern} ({activePattern.ValidationStatus}, {activePattern.Confidence:F0}% conf)");
            }
        }
        else
        {
            patternScore = 52m;
        }

        // 4. Momentum Score (ADX & Stochastic) (0 - 100)
        decimal momentumScore = 50m;
        if (technical.Adx.TrendStrength == "STRONG_TREND")
        {
            if (technical.Adx.PlusDi > technical.Adx.MinusDi)
            {
                momentumScore = 80m;
                confluenceFactors.Add($"Strong directional trend (ADX {technical.Adx.Value:F1} with +DI dominant)");
            }
            else
            {
                momentumScore = 20m;
                conflictingFactors.Add($"Strong downward trend (ADX {technical.Adx.Value:F1} with -DI dominant)");
            }
        }
        else
        {
            momentumScore = 52m;
            confluenceFactors.Add($"Moderate trend strength (ADX {technical.Adx.Value:F1})");
        }

        // 5. Risk / Volatility Score (0 - 100)
        decimal riskScore = 75m;
        if (technical.BollingerBands.Bandwidth > 8m)
        {
            riskScore = 58m; // High volatility expands risk
            conflictingFactors.Add("Elevated Bollinger volatility bandwidth");
        }
        else
        {
            confluenceFactors.Add("Controlled ATR volatility environment suitable for institutional execution");
        }

        // Final Composite Score Calculation
        // Weights: Technical 25%, Structure 25%, Pattern 20%, Momentum 15%, Risk 15%
        decimal finalScore = Math.Round(
            (techScore * 0.25m) +
            (structScore * 0.25m) +
            (patternScore * 0.20m) +
            (momentumScore * 0.15m) +
            (riskScore * 0.15m), 1);

        // Strict deterministic signal selection with strict bias towards WAIT
        string signal = "WAIT";
        string strength = "MODERATE";

        bool isBullishConfluence = (structure.Structure == "BULLISH" && techBull > techBear && finalScore >= 72m);
        bool isBearishConfluence = (structure.Structure == "BEARISH" && techBear > techBull && finalScore <= 35m);

        if (isBullishConfluence)
        {
            signal = "BUY";
            strength = finalScore >= 82m ? "STRONG" : "MODERATE";
        }
        else if (isBearishConfluence)
        {
            signal = "SELL";
            // Map bearish finalScore into strength
            strength = finalScore <= 25m ? "STRONG" : "MODERATE";
            finalScore = 100m - finalScore; // Invert to positive confidence for UI display
        }
        else
        {
            signal = "WAIT";
            strength = "MODERATE";
            confluenceFactors.Add("Disciplined execution filter: Conflicting signals require waiting for confirmed setup.");
        }

        return new ConfluenceSignalDto
        {
            Symbol = symbol,
            Timeframe = timeframe,
            TechnicalScore = Math.Round(techScore, 1),
            StructureScore = Math.Round(structScore, 1),
            PatternScore = Math.Round(patternScore, 1),
            MomentumScore = Math.Round(momentumScore, 1),
            RiskScore = Math.Round(riskScore, 1),
            FinalScore = finalScore,
            Signal = signal,
            Strength = strength,
            ConfluenceFactors = confluenceFactors,
            ConflictingFactors = conflictingFactors,
            Timestamp = DateTime.UtcNow
        };
    }
}
