using SYAFX.Api.DTOs;
using SYAFX.Api.Indicators;
using SYAFX.Api.Models;

namespace SYAFX.Api.Engines;

public class MarketStructureEngine
{
    public static MarketStructureDto Analyze(IReadOnlyList<Candle> candles)
    {
        if (candles == null || candles.Count < 20)
        {
            return new MarketStructureDto
            {
                Structure = "RANGING",
                Confidence = 50,
                Explanation = "Insufficient candle history for confirmed market structure."
            };
        }

        decimal atr = ATRIndicator.CalculateLatest(candles, 14);
        decimal minSwingThreshold = atr * 0.5m; // Filter micro fluctuations

        // 1. Identify raw swing highs and lows
        var rawHighs = new List<(int Index, DateTime Time, decimal Price)>();
        var rawLows = new List<(int Index, DateTime Time, decimal Price)>();

        int span = 3; // 3 bars left, 3 bars right
        for (int i = span; i < candles.Count - span; i++)
        {
            bool isHigh = true;
            bool isLow = true;

            for (int j = i - span; j <= i + span; j++)
            {
                if (j == i) continue;
                if (candles[j].High >= candles[i].High) isHigh = false;
                if (candles[j].Low <= candles[i].Low) isLow = false;
            }

            if (isHigh && (candles[i].High - candles[i].Low) >= minSwingThreshold)
            {
                rawHighs.Add((i, candles[i].Timestamp, candles[i].High));
            }
            if (isLow && (candles[i].High - candles[i].Low) >= minSwingThreshold)
            {
                rawLows.Add((i, candles[i].Timestamp, candles[i].Low));
            }
        }

        // 2. Classify Swing Points (HH, LH, HL, LL)
        var recentHighs = new List<SwingPointDto>();
        for (int i = 0; i < rawHighs.Count; i++)
        {
            string type = (i > 0 && rawHighs[i].Price > rawHighs[i - 1].Price) ? "HH" : "LH";
            recentHighs.Add(new SwingPointDto
            {
                Index = rawHighs[i].Index,
                Timestamp = rawHighs[i].Time,
                Price = Math.Round(rawHighs[i].Price, 5),
                Type = type
            });
        }

        var recentLows = new List<SwingPointDto>();
        for (int i = 0; i < rawLows.Count; i++)
        {
            string type = (i > 0 && rawLows[i].Price > rawLows[i - 1].Price) ? "HL" : "LL";
            recentLows.Add(new SwingPointDto
            {
                Index = rawLows[i].Index,
                Timestamp = rawLows[i].Time,
                Price = Math.Round(rawLows[i].Price, 5),
                Type = type
            });
        }

        // 3. Determine Overall Structure & Confidence
        int hhCount = recentHighs.TakeLast(3).Count(h => h.Type == "HH");
        int lhCount = recentHighs.TakeLast(3).Count(h => h.Type == "LH");
        int hlCount = recentLows.TakeLast(3).Count(l => l.Type == "HL");
        int llCount = recentLows.TakeLast(3).Count(l => l.Type == "LL");

        string structure = "RANGING";
        decimal confidence = 60m;

        if (hhCount >= 2 && hlCount >= 1)
        {
            structure = "BULLISH";
            confidence = Math.Min(95m, 70m + (hhCount + hlCount) * 6m);
        }
        else if (lhCount >= 2 && llCount >= 1)
        {
            structure = "BEARISH";
            confidence = Math.Min(95m, 70m + (lhCount + llCount) * 6m);
        }
        else
        {
            structure = "RANGING";
            confidence = 55m;
        }

        // 4. Detect Break of Structure (BOS) and Change of Character (CHOCH)
        StructureBreakDto? bos = null;
        StructureBreakDto? choch = null;

        var lastCandle = candles[^1];
        var recentCandles = candles.TakeLast(10).ToList();

        if (recentHighs.Count > 0)
        {
            var lastHigh = recentHighs[^1];
            // Check if any recent candle closed above this high
            for (int k = 0; k < recentCandles.Count; k++)
            {
                var c = recentCandles[k];
                if (c.Timestamp > lastHigh.Timestamp && c.Close > lastHigh.Price)
                {
                    if (structure == "BULLISH")
                    {
                        bos = new StructureBreakDto
                        {
                            Detected = true,
                            Type = "BOS",
                            Direction = "BULLISH",
                            BreakoutLevel = lastHigh.Price,
                            CandleIndex = candles.Count - (recentCandles.Count - k),
                            Timestamp = c.Timestamp,
                            VolumeRatio = 1.4m,
                            ConfirmationReason = $"Confirmed candle close ({c.Close:F5}) above previous swing high ({lastHigh.Price:F5})"
                        };
                    }
                    else if (structure == "BEARISH" || lastHigh.Type == "LH")
                    {
                        choch = new StructureBreakDto
                        {
                            Detected = true,
                            Type = "CHOCH",
                            Direction = "BULLISH",
                            BreakoutLevel = lastHigh.Price,
                            CandleIndex = candles.Count - (recentCandles.Count - k),
                            Timestamp = c.Timestamp,
                            VolumeRatio = 1.6m,
                            ConfirmationReason = $"Bearish trend invalidated: Break of character above Lower High ({lastHigh.Price:F5})"
                        };
                    }
                    break;
                }
            }
        }

        if (recentLows.Count > 0)
        {
            var lastLow = recentLows[^1];
            // Check if any recent candle closed below this low
            for (int k = 0; k < recentCandles.Count; k++)
            {
                var c = recentCandles[k];
                if (c.Timestamp > lastLow.Timestamp && c.Close < lastLow.Price)
                {
                    if (structure == "BEARISH")
                    {
                        bos = new StructureBreakDto
                        {
                            Detected = true,
                            Type = "BOS",
                            Direction = "BEARISH",
                            BreakoutLevel = lastLow.Price,
                            CandleIndex = candles.Count - (recentCandles.Count - k),
                            Timestamp = c.Timestamp,
                            VolumeRatio = 1.4m,
                            ConfirmationReason = $"Confirmed candle close ({c.Close:F5}) below previous swing low ({lastLow.Price:F5})"
                        };
                    }
                    else if (structure == "BULLISH" || lastLow.Type == "HL")
                    {
                        choch = new StructureBreakDto
                        {
                            Detected = true,
                            Type = "CHOCH",
                            Direction = "BEARISH",
                            BreakoutLevel = lastLow.Price,
                            CandleIndex = candles.Count - (recentCandles.Count - k),
                            Timestamp = c.Timestamp,
                            VolumeRatio = 1.7m,
                            ConfirmationReason = $"Bullish trend broken: Change of character below Higher Low ({lastLow.Price:F5})"
                        };
                    }
                    break;
                }
            }
        }

        decimal majorResistance = recentHighs.Count > 0 ? recentHighs.Max(h => h.Price) : candles.Max(c => c.High);
        decimal majorSupport = recentLows.Count > 0 ? recentLows.Min(l => l.Price) : candles.Min(c => c.Low);

        string explanation = structure switch
        {
            "BULLISH" => $"Market is establishing Higher Highs and Higher Lows. Buyers in control with {confidence:F0}% confidence.",
            "BEARISH" => $"Market is creating Lower Highs and Lower Lows. Supply overhang dominant with {confidence:F0}% confidence.",
            _ => "Price is consolidating within bounds. No definitive directional dominance detected."
        };

        return new MarketStructureDto
        {
            Structure = structure,
            Confidence = Math.Round(confidence, 1),
            RecentHighs = recentHighs.TakeLast(5).ToList(),
            RecentLows = recentLows.TakeLast(5).ToList(),
            Bos = bos,
            Choch = choch,
            MajorResistance = majorResistance,
            MajorSupport = majorSupport,
            Explanation = explanation
        };
    }
}
