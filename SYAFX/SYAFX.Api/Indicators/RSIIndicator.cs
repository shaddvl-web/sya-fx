using SYAFX.Api.Models;

namespace SYAFX.Api.Indicators;

public class RSIIndicator
{
    public static List<decimal?> CalculateSeries(IReadOnlyList<Candle> candles, int period = 14)
    {
        var rsiValues = new List<decimal?>(candles.Count);
        if (candles.Count <= period)
        {
            for (int i = 0; i < candles.Count; i++) rsiValues.Add(null);
            return rsiValues;
        }

        // Initialize with nulls
        for (int i = 0; i < period; i++) rsiValues.Add(null);

        decimal gainSum = 0;
        decimal lossSum = 0;

        for (int i = 1; i <= period; i++)
        {
            decimal change = candles[i].Close - candles[i - 1].Close;
            if (change > 0) gainSum += change;
            else lossSum += Math.Abs(change);
        }

        decimal avgGain = gainSum / period;
        decimal avgLoss = lossSum / period;

        decimal rs = avgLoss == 0 ? 100 : avgGain / avgLoss;
        decimal firstRsi = avgLoss == 0 ? 100 : 100 - (100 / (1 + rs));
        rsiValues.Add(Math.Round(firstRsi, 2));

        for (int i = period + 1; i < candles.Count; i++)
        {
            decimal change = candles[i].Close - candles[i - 1].Close;
            decimal currentGain = change > 0 ? change : 0;
            decimal currentLoss = change < 0 ? Math.Abs(change) : 0;

            avgGain = ((avgGain * (period - 1)) + currentGain) / period;
            avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;

            decimal currentRs = avgLoss == 0 ? 100 : avgGain / avgLoss;
            decimal currentRsi = avgLoss == 0 ? 100 : 100 - (100 / (1 + currentRs));
            rsiValues.Add(Math.Round(currentRsi, 2));
        }

        return rsiValues;
    }

    public static decimal CalculateLatest(IReadOnlyList<Candle> candles, int period = 14)
    {
        var series = CalculateSeries(candles, period);
        for (int i = series.Count - 1; i >= 0; i--)
        {
            if (series[i].HasValue) return series[i]!.Value;
        }
        return 50.0m;
    }
}
