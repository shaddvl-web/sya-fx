using SYAFX.Api.DTOs;
using SYAFX.Api.Models;

namespace SYAFX.Api.Indicators;

public class BollingerBandsIndicator
{
    public static BollingerBandsDto CalculateLatest(IReadOnlyList<Candle> candles, int period = 20, decimal multiplier = 2.0m)
    {
        if (candles.Count < period)
        {
            decimal close = candles.Count > 0 ? candles[^1].Close : 0;
            return new BollingerBandsDto { Upper = close, Middle = close, Lower = close, Bandwidth = 0, PercentB = 50 };
        }

        int start = candles.Count - period;
        decimal sum = 0;
        for (int i = start; i < candles.Count; i++)
        {
            sum += candles[i].Close;
        }
        decimal sma = sum / period;

        decimal sumSquares = 0;
        for (int i = start; i < candles.Count; i++)
        {
            decimal diff = candles[i].Close - sma;
            sumSquares += diff * diff;
        }
        decimal variance = sumSquares / period;
        decimal stdDev = (decimal)Math.Sqrt((double)variance);

        decimal upper = sma + (multiplier * stdDev);
        decimal lower = sma - (multiplier * stdDev);
        decimal bandwidth = sma > 0 ? ((upper - lower) / sma) * 100 : 0;

        decimal currentClose = candles[^1].Close;
        decimal percentB = (upper - lower) > 0 ? ((currentClose - lower) / (upper - lower)) * 100 : 50;

        return new BollingerBandsDto
        {
            Upper = Math.Round(upper, 5),
            Middle = Math.Round(sma, 5),
            Lower = Math.Round(lower, 5),
            Bandwidth = Math.Round(bandwidth, 2),
            PercentB = Math.Round(percentB, 2)
        };
    }
}
