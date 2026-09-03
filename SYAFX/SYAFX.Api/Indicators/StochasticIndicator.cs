using SYAFX.Api.DTOs;
using SYAFX.Api.Models;

namespace SYAFX.Api.Indicators;

public class StochasticIndicator
{
    public static StochasticDto CalculateLatest(IReadOnlyList<Candle> candles, int kPeriod = 14, int dPeriod = 3)
    {
        if (candles.Count < kPeriod + dPeriod)
        {
            return new StochasticDto { K = 50, D = 50, Condition = "NEUTRAL" };
        }

        var fastKList = new List<decimal>();

        for (int i = kPeriod - 1; i < candles.Count; i++)
        {
            decimal highestHigh = decimal.MinValue;
            decimal lowestLow = decimal.MaxValue;

            for (int j = i - kPeriod + 1; j <= i; j++)
            {
                if (candles[j].High > highestHigh) highestHigh = candles[j].High;
                if (candles[j].Low < lowestLow) lowestLow = candles[j].Low;
            }

            decimal currentClose = candles[i].Close;
            decimal range = highestHigh - lowestLow;
            decimal k = range > 0 ? ((currentClose - lowestLow) / range) * 100 : 50;
            fastKList.Add(k);
        }

        decimal currentK = fastKList[^1];
        decimal currentD = 0;
        int dCount = Math.Min(dPeriod, fastKList.Count);
        for (int i = fastKList.Count - dCount; i < fastKList.Count; i++)
        {
            currentD += fastKList[i];
        }
        currentD /= dCount;

        string condition = "NEUTRAL";
        if (currentK >= 80 && currentD >= 80) condition = "OVERBOUGHT";
        else if (currentK <= 20 && currentD <= 20) condition = "OVERSOLD";

        return new StochasticDto
        {
            K = Math.Round(currentK, 2),
            D = Math.Round(currentD, 2),
            Condition = condition
        };
    }
}
