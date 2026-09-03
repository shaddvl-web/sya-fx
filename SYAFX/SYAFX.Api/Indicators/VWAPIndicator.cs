using SYAFX.Api.Models;

namespace SYAFX.Api.Indicators;

public class VWAPIndicator
{
    public static decimal CalculateLatest(IReadOnlyList<Candle> candles)
    {
        if (candles.Count == 0) return 0;

        decimal cumulativePv = 0;
        decimal cumulativeVol = 0;

        // Take last 50-100 bars or daily session
        int count = Math.Min(candles.Count, 96); // ~24 hours of M15
        int start = candles.Count - count;

        for (int i = start; i < candles.Count; i++)
        {
            decimal typicalPrice = (candles[i].High + candles[i].Low + candles[i].Close) / 3.0m;
            decimal vol = candles[i].Volume > 0 ? candles[i].Volume : 100m;
            cumulativePv += typicalPrice * vol;
            cumulativeVol += vol;
        }

        return cumulativeVol > 0 ? Math.Round(cumulativePv / cumulativeVol, 5) : candles[^1].Close;
    }
}
