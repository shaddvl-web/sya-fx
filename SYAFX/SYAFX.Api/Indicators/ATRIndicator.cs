using SYAFX.Api.Models;

namespace SYAFX.Api.Indicators;

public class ATRIndicator
{
    public static List<decimal?> CalculateSeries(IReadOnlyList<Candle> candles, int period = 14)
    {
        var result = new List<decimal?>(candles.Count);
        if (candles.Count <= period)
        {
            for (int i = 0; i < candles.Count; i++) result.Add(null);
            return result;
        }

        var trList = new List<decimal>(candles.Count);
        trList.Add(candles[0].High - candles[0].Low);

        for (int i = 1; i < candles.Count; i++)
        {
            decimal hl = candles[i].High - candles[i].Low;
            decimal hc = Math.Abs(candles[i].High - candles[i - 1].Close);
            decimal lc = Math.Abs(candles[i].Low - candles[i - 1].Close);
            decimal tr = Math.Max(hl, Math.Max(hc, lc));
            trList.Add(tr);
        }

        for (int i = 0; i < period; i++) result.Add(null);

        decimal initialAtr = 0;
        for (int i = 0; i < period; i++) initialAtr += trList[i];
        initialAtr /= period;
        result[period - 1] = initialAtr;

        decimal prevAtr = initialAtr;
        for (int i = period; i < candles.Count; i++)
        {
            decimal currentAtr = (prevAtr * (period - 1) + trList[i]) / period;
            result.Add(currentAtr);
            prevAtr = currentAtr;
        }

        return result;
    }

    public static decimal CalculateLatest(IReadOnlyList<Candle> candles, int period = 14)
    {
        var series = CalculateSeries(candles, period);
        for (int i = series.Count - 1; i >= 0; i--)
        {
            if (series[i].HasValue) return Math.Round(series[i]!.Value, 5);
        }
        return 0.0015m;
    }
}
