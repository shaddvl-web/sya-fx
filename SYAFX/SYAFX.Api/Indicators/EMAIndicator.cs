using SYAFX.Api.Models;

namespace SYAFX.Api.Indicators;

public class EMAIndicator
{
    public static List<decimal?> CalculateSeries(IReadOnlyList<Candle> candles, int period)
    {
        var result = new List<decimal?>(candles.Count);
        if (candles.Count < period)
        {
            for (int i = 0; i < candles.Count; i++) result.Add(null);
            return result;
        }

        decimal multiplier = 2.0m / (period + 1);

        // First value is simple SMA of first 'period' candles
        decimal initialSma = 0;
        for (int i = 0; i < period; i++)
        {
            initialSma += candles[i].Close;
            result.Add(null);
        }
        initialSma /= period;
        result[period - 1] = initialSma;

        decimal prevEma = initialSma;
        for (int i = period; i < candles.Count; i++)
        {
            decimal currentEma = (candles[i].Close - prevEma) * multiplier + prevEma;
            result.Add(currentEma);
            prevEma = currentEma;
        }

        return result;
    }

    public static decimal CalculateLatest(IReadOnlyList<Candle> candles, int period)
    {
        var series = CalculateSeries(candles, period);
        for (int i = series.Count - 1; i >= 0; i--)
        {
            if (series[i].HasValue) return series[i]!.Value;
        }
        return candles.Count > 0 ? candles[^1].Close : 0m;
    }
}
