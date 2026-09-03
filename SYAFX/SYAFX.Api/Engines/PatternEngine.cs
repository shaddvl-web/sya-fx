using SYAFX.Api.DTOs;
using SYAFX.Api.Indicators;
using SYAFX.Api.Models;

namespace SYAFX.Api.Engines;

public class PatternEngine
{
    public static List<PatternDetectionDto> DetectPatterns(IReadOnlyList<Candle> candles)
    {
        var detected = new List<PatternDetectionDto>();
        if (candles == null || candles.Count < 30) return detected;

        decimal atr = ATRIndicator.CalculateLatest(candles, 14);
        decimal tolerance = atr * 0.45m;

        // Extract local extrema
        var peaks = new List<(int Index, decimal Price, DateTime Time)>();
        var valleys = new List<(int Index, decimal Price, DateTime Time)>();

        int span = 3;
        for (int i = span; i < candles.Count - span; i++)
        {
            if (candles[i].High >= candles[i - 1].High && candles[i].High >= candles[i - 2].High &&
                candles[i].High >= candles[i + 1].High && candles[i].High >= candles[i + 2].High)
            {
                peaks.Add((i, candles[i].High, candles[i].Timestamp));
            }
            if (candles[i].Low <= candles[i - 1].Low && candles[i].Low <= candles[i - 2].Low &&
                candles[i].Low <= candles[i + 1].Low && candles[i].Low <= candles[i + 2].Low)
            {
                valleys.Add((i, candles[i].Low, candles[i].Timestamp));
            }
        }

        // 1. Double Bottom (Two troughs near same price level separated by a peak)
        if (valleys.Count >= 2 && peaks.Count >= 1)
        {
            for (int i = valleys.Count - 1; i >= 1; i--)
            {
                var v2 = valleys[i];
                var v1 = valleys[i - 1];
                if (v2.Index - v1.Index >= 5 && v2.Index - v1.Index <= 45)
                {
                    decimal priceDiff = Math.Abs(v1.Price - v2.Price);
                    if (priceDiff <= tolerance)
                    {
                        var interPeak = peaks.FirstOrDefault(p => p.Index > v1.Index && p.Index < v2.Index);
                        if (interPeak.Index > 0)
                        {
                            decimal neckline = interPeak.Price;
                            decimal depth = neckline - Math.Min(v1.Price, v2.Price);
                            decimal currentPrice = candles[^1].Close;
                            bool validated = currentPrice >= neckline - (atr * 0.2m);

                            decimal symmetry = 100m - (priceDiff / (depth > 0 ? depth : 1m)) * 40m;
                            decimal quality = Math.Clamp(symmetry, 65m, 96m);
                            decimal confidence = validated ? Math.Clamp(quality + 8m, 75m, 98m) : quality - 10m;

                            detected.Add(new PatternDetectionDto
                            {
                                Pattern = "DOUBLE_BOTTOM",
                                Direction = "BULLISH",
                                Confidence = Math.Round(confidence, 1),
                                Quality = Math.Round(quality, 1),
                                StartIndex = v1.Index,
                                EndIndex = v2.Index,
                                ValidationStatus = validated ? "VALIDATED" : "PENDING",
                                TargetPrice = Math.Round(neckline + depth, 5),
                                InvalidationLevel = Math.Round(Math.Min(v1.Price, v2.Price) - (atr * 0.5m), 5),
                                Description = $"Bullish reversal base formed between {v1.Price:F5} and {v2.Price:F5}. Neckline at {neckline:F5}."
                            });
                            break;
                        }
                    }
                }
            }
        }

        // 2. Double Top (Two peaks near same price level separated by a valley)
        if (peaks.Count >= 2 && valleys.Count >= 1)
        {
            for (int i = peaks.Count - 1; i >= 1; i--)
            {
                var p2 = peaks[i];
                var p1 = peaks[i - 1];
                if (p2.Index - p1.Index >= 5 && p2.Index - p1.Index <= 45)
                {
                    decimal priceDiff = Math.Abs(p1.Price - p2.Price);
                    if (priceDiff <= tolerance)
                    {
                        var interValley = valleys.FirstOrDefault(v => v.Index > p1.Index && v.Index < p2.Index);
                        if (interValley.Index > 0)
                        {
                            decimal neckline = interValley.Price;
                            decimal height = Math.Max(p1.Price, p2.Price) - neckline;
                            decimal currentPrice = candles[^1].Close;
                            bool validated = currentPrice <= neckline + (atr * 0.2m);

                            decimal symmetry = 100m - (priceDiff / (height > 0 ? height : 1m)) * 40m;
                            decimal quality = Math.Clamp(symmetry, 65m, 95m);
                            decimal confidence = validated ? Math.Clamp(quality + 8m, 75m, 96m) : quality - 10m;

                            detected.Add(new PatternDetectionDto
                            {
                                Pattern = "DOUBLE_TOP",
                                Direction = "BEARISH",
                                Confidence = Math.Round(confidence, 1),
                                Quality = Math.Round(quality, 1),
                                StartIndex = p1.Index,
                                EndIndex = p2.Index,
                                ValidationStatus = validated ? "VALIDATED" : "PENDING",
                                TargetPrice = Math.Round(neckline - height, 5),
                                InvalidationLevel = Math.Round(Math.Max(p1.Price, p2.Price) + (atr * 0.5m), 5),
                                Description = $"Bearish rejection double top formed between {p1.Price:F5} and {p2.Price:F5}. Neckline at {neckline:F5}."
                            });
                            break;
                        }
                    }
                }
            }
        }

        // 3. Head and Shoulders (Left Shoulder, Head higher, Right Shoulder lower than Head)
        if (peaks.Count >= 3 && valleys.Count >= 2)
        {
            var p3 = peaks[^1];
            var p2 = peaks[^2];
            var p1 = peaks[^3];

            if (p2.Price > p1.Price && p2.Price > p3.Price)
            {
                decimal shoulderDiff = Math.Abs(p1.Price - p3.Price);
                if (shoulderDiff <= tolerance * 1.5m)
                {
                    decimal neckline = valleys.TakeLast(2).Average(v => v.Price);
                    decimal headHeight = p2.Price - neckline;
                    bool validated = candles[^1].Close <= neckline;

                    detected.Add(new PatternDetectionDto
                    {
                        Pattern = "HEAD_AND_SHOULDERS",
                        Direction = "BEARISH",
                        Confidence = validated ? 88.5m : 74.2m,
                        Quality = 84.0m,
                        StartIndex = p1.Index,
                        EndIndex = p3.Index,
                        ValidationStatus = validated ? "VALIDATED" : "PENDING",
                        TargetPrice = Math.Round(neckline - headHeight, 5),
                        InvalidationLevel = Math.Round(p2.Price + (atr * 0.3m), 5),
                        Description = $"Classic H&S reversal structure with Head at {p2.Price:F5} and shoulders aligned."
                    });
                }
            }
        }

        // 4. Inverse Head and Shoulders
        if (valleys.Count >= 3 && peaks.Count >= 2)
        {
            var v3 = valleys[^1];
            var v2 = valleys[^2];
            var v1 = valleys[^3];

            if (v2.Price < v1.Price && v2.Price < v3.Price)
            {
                decimal shoulderDiff = Math.Abs(v1.Price - v3.Price);
                if (shoulderDiff <= tolerance * 1.5m)
                {
                    decimal neckline = peaks.TakeLast(2).Average(p => p.Price);
                    decimal headDepth = neckline - v2.Price;
                    bool validated = candles[^1].Close >= neckline;

                    detected.Add(new PatternDetectionDto
                    {
                        Pattern = "INVERSE_HEAD_AND_SHOULDERS",
                        Direction = "BULLISH",
                        Confidence = validated ? 89.2m : 76.0m,
                        Quality = 85.5m,
                        StartIndex = v1.Index,
                        EndIndex = v3.Index,
                        ValidationStatus = validated ? "VALIDATED" : "PENDING",
                        TargetPrice = Math.Round(neckline + headDepth, 5),
                        InvalidationLevel = Math.Round(v2.Price - (atr * 0.3m), 5),
                        Description = $"Bullish inverse H&S accumulation structure with Head trough at {v2.Price:F5}."
                    });
                }
            }
        }

        // 5 & 6 & 7. Triangles (Ascending, Descending, Symmetrical)
        if (peaks.Count >= 2 && valleys.Count >= 2)
        {
            var pLast = peaks[^1];
            var pPrev = peaks[^2];
            var vLast = valleys[^1];
            var vPrev = valleys[^2];

            decimal highSlope = pLast.Price - pPrev.Price;
            decimal lowSlope = vLast.Price - vPrev.Price;

            // Ascending Triangle: Flat Highs + Higher Lows
            if (Math.Abs(highSlope) <= tolerance * 0.6m && lowSlope > tolerance * 0.5m)
            {
                detected.Add(new PatternDetectionDto
                {
                    Pattern = "ASCENDING_TRIANGLE",
                    Direction = "BULLISH",
                    Confidence = 85.4m,
                    Quality = 82.0m,
                    StartIndex = Math.Min(pPrev.Index, vPrev.Index),
                    EndIndex = Math.Max(pLast.Index, vLast.Index),
                    ValidationStatus = candles[^1].Close > pLast.Price ? "VALIDATED" : "PENDING",
                    TargetPrice = Math.Round(pLast.Price + (pLast.Price - vPrev.Price), 5),
                    InvalidationLevel = Math.Round(vLast.Price - (atr * 0.4m), 5),
                    Description = $"Ascending triangle consolidation pressing horizontal resistance at {pLast.Price:F5}."
                });
            }
            // Descending Triangle: Lower Highs + Flat Lows
            else if (Math.Abs(lowSlope) <= tolerance * 0.6m && highSlope < -tolerance * 0.5m)
            {
                detected.Add(new PatternDetectionDto
                {
                    Pattern = "DESCENDING_TRIANGLE",
                    Direction = "BEARISH",
                    Confidence = 86.1m,
                    Quality = 83.2m,
                    StartIndex = Math.Min(pPrev.Index, vPrev.Index),
                    EndIndex = Math.Max(pLast.Index, vLast.Index),
                    ValidationStatus = candles[^1].Close < vLast.Price ? "VALIDATED" : "PENDING",
                    TargetPrice = Math.Round(vLast.Price - (pPrev.Price - vLast.Price), 5),
                    InvalidationLevel = Math.Round(pLast.Price + (atr * 0.4m), 5),
                    Description = $"Descending triangle building sell pressure against support floor at {vLast.Price:F5}."
                });
            }
            // Symmetrical Triangle: Lower Highs + Higher Lows converging
            else if (highSlope < -tolerance * 0.4m && lowSlope > tolerance * 0.4m)
            {
                detected.Add(new PatternDetectionDto
                {
                    Pattern = "SYMMETRICAL_TRIANGLE",
                    Direction = candles[^1].Close > (pLast.Price + vLast.Price) / 2m ? "BULLISH" : "BEARISH",
                    Confidence = 81.0m,
                    Quality = 79.5m,
                    StartIndex = Math.Min(pPrev.Index, vPrev.Index),
                    EndIndex = Math.Max(pLast.Index, vLast.Index),
                    ValidationStatus = "PENDING",
                    TargetPrice = Math.Round(pLast.Price + (pPrev.Price - vPrev.Price) * 0.7m, 5),
                    InvalidationLevel = Math.Round(vLast.Price, 5),
                    Description = $"Volatility compression coil between converging trendlines awaiting directional breakout."
                });
            }
        }

        // 8 & 9. Bull Flag & Bear Flag
        if (candles.Count >= 25)
        {
            var poleCandles = candles.Skip(candles.Count - 25).Take(10).ToList();
            var flagCandles = candles.TakeLast(15).ToList();

            decimal poleMove = poleCandles[^1].Close - poleCandles[0].Open;
            decimal flagMove = flagCandles[^1].Close - flagCandles[0].Open;

            // Bull Flag: Strong upward impulse followed by gentle downward channel
            if (poleMove > atr * 3.5m && flagMove < 0 && Math.Abs(flagMove) < poleMove * 0.5m)
            {
                detected.Add(new PatternDetectionDto
                {
                    Pattern = "BULL_FLAG",
                    Direction = "BULLISH",
                    Confidence = 87.8m,
                    Quality = 86.0m,
                    StartIndex = candles.Count - 25,
                    EndIndex = candles.Count - 1,
                    ValidationStatus = candles[^1].Close > flagCandles.Max(c => c.High) ? "VALIDATED" : "PENDING",
                    TargetPrice = Math.Round(candles[^1].Close + poleMove, 5),
                    InvalidationLevel = Math.Round(flagCandles.Min(c => c.Low) - (atr * 0.3m), 5),
                    Description = $"High momentum bull flag continuation. Flagpole gain of {poleMove:F5} with controlled retracement."
                });
            }
            // Bear Flag: Strong downward impulse followed by gentle upward channel
            else if (poleMove < -atr * 3.5m && flagMove > 0 && flagMove < Math.Abs(poleMove) * 0.5m)
            {
                detected.Add(new PatternDetectionDto
                {
                    Pattern = "BEAR_FLAG",
                    Direction = "BEARISH",
                    Confidence = 88.0m,
                    Quality = 85.5m,
                    StartIndex = candles.Count - 25,
                    EndIndex = candles.Count - 1,
                    ValidationStatus = candles[^1].Close < flagCandles.Min(c => c.Low) ? "VALIDATED" : "PENDING",
                    TargetPrice = Math.Round(candles[^1].Close + poleMove, 5),
                    InvalidationLevel = Math.Round(flagCandles.Max(c => c.High) + (atr * 0.3m), 5),
                    Description = $"Bear flag continuation. Downward impulse of {poleMove:F5} consolidating into weak pullback."
                });
            }
        }

        // 10 & 11. Rising Wedge & Falling Wedge
        if (peaks.Count >= 2 && valleys.Count >= 2)
        {
            var pLast = peaks[^1];
            var pPrev = peaks[^2];
            var vLast = valleys[^1];
            var vPrev = valleys[^2];

            decimal highSlope = pLast.Price - pPrev.Price;
            decimal lowSlope = vLast.Price - vPrev.Price;

            // Rising Wedge: Both slopes positive, but low slope steeper (converging upwards -> Bearish)
            if (highSlope > 0 && lowSlope > 0 && lowSlope > highSlope + (tolerance * 0.2m))
            {
                detected.Add(new PatternDetectionDto
                {
                    Pattern = "RISING_WEDGE",
                    Direction = "BEARISH",
                    Confidence = 83.5m,
                    Quality = 80.0m,
                    StartIndex = Math.Min(pPrev.Index, vPrev.Index),
                    EndIndex = Math.Max(pLast.Index, vLast.Index),
                    ValidationStatus = candles[^1].Close < vLast.Price ? "VALIDATED" : "PENDING",
                    TargetPrice = Math.Round(vPrev.Price, 5),
                    InvalidationLevel = Math.Round(pLast.Price + (atr * 0.4m), 5),
                    Description = $"Ascending wedge with decelerating upward momentum signaling potential bearish breakdown."
                });
            }
            // Falling Wedge: Both slopes negative, but high slope steeper (converging downwards -> Bullish)
            else if (highSlope < 0 && lowSlope < 0 && highSlope > lowSlope - (tolerance * 0.2m))
            {
                detected.Add(new PatternDetectionDto
                {
                    Pattern = "FALLING_WEDGE",
                    Direction = "BULLISH",
                    Confidence = 84.2m,
                    Quality = 81.5m,
                    StartIndex = Math.Min(pPrev.Index, vPrev.Index),
                    EndIndex = Math.Max(pLast.Index, vLast.Index),
                    ValidationStatus = candles[^1].Close > pLast.Price ? "VALIDATED" : "PENDING",
                    TargetPrice = Math.Round(pPrev.Price, 5),
                    InvalidationLevel = Math.Round(vLast.Price - (atr * 0.4m), 5),
                    Description = $"Descending wedge compressing selling pressure into bullish reversal breakout."
                });
            }
        }

        return detected;
    }
}
