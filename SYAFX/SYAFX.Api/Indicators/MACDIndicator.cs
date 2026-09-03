using SYAFX.Api.DTOs;
using SYAFX.Api.Models;

namespace SYAFX.Api.Indicators;

public class MACDIndicator
{
    public static MacdValueDto CalculateLatest(IReadOnlyList<Candle> candles, int fastPeriod = 12, int slowPeriod = 26, int signalPeriod = 9)
    {
        if (candles.Count < slowPeriod + signalPeriod)
        {
            return new MacdValueDto { MacdLine = 0, SignalLine = 0, Histogram = 0, Crossover = "NONE" };
        }

        var fastEma = EMAIndicator.CalculateSeries(candles, fastPeriod);
        var slowEma = EMAIndicator.CalculateSeries(candles, slowPeriod);

        // MACD Line = Fast EMA - Slow EMA
        var macdLine = new List<decimal?>(candles.Count);
        var macdCandles = new List<Candle>();

        for (int i = 0; i < candles.Count; i++)
        {
            if (fastEma[i].HasValue && slowEma[i].HasValue)
            {
                decimal macdVal = fastEma[i]!.Value - slowEma[i]!.Value;
                macdLine.Add(macdVal);
                macdCandles.Add(new Candle { Close = macdVal });
            }
            else
            {
                macdLine.Add(null);
            }
        }

        var signalEma = EMAIndicator.CalculateSeries(macdCandles, signalPeriod);

        if (macdCandles.Count < 2 || signalEma.Count < 2)
        {
            return new MacdValueDto { MacdLine = 0, SignalLine = 0, Histogram = 0, Crossover = "NONE" };
        }

        int lastIdx = macdCandles.Count - 1;
        decimal currentMacd = macdCandles[lastIdx].Close;
        decimal currentSignal = signalEma[lastIdx] ?? currentMacd;
        decimal currentHist = currentMacd - currentSignal;

        decimal prevMacd = macdCandles[lastIdx - 1].Close;
        decimal prevSignal = signalEma[lastIdx - 1] ?? prevMacd;
        decimal prevHist = prevMacd - prevSignal;

        string crossover = "NONE";
        if (prevHist <= 0 && currentHist > 0) crossover = "BULLISH_CROSS";
        else if (prevHist >= 0 && currentHist < 0) crossover = "BEARISH_CROSS";

        return new MacdValueDto
        {
            MacdLine = Math.Round(currentMacd, 5),
            SignalLine = Math.Round(currentSignal, 5),
            Histogram = Math.Round(currentHist, 5),
            Crossover = crossover
        };
    }
}
