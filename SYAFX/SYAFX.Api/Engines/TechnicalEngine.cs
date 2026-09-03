using SYAFX.Api.DTOs;
using SYAFX.Api.Indicators;
using SYAFX.Api.Models;

namespace SYAFX.Api.Engines;

public class TechnicalEngine
{
    public static TechnicalAnalysisDto Analyze(IReadOnlyList<Candle> candles)
    {
        if (candles == null || candles.Count == 0)
        {
            return new TechnicalAnalysisDto();
        }

        decimal ema20 = EMAIndicator.CalculateLatest(candles, 20);
        decimal ema50 = EMAIndicator.CalculateLatest(candles, 50);
        decimal ema200 = EMAIndicator.CalculateLatest(candles, 200);

        decimal rsi = RSIIndicator.CalculateLatest(candles, 14);
        string rsiCond = rsi >= 70 ? "OVERBOUGHT" : (rsi <= 30 ? "OVERSOLD" : "NEUTRAL");

        var macd = MACDIndicator.CalculateLatest(candles, 12, 26, 9);
        decimal atr = ATRIndicator.CalculateLatest(candles, 14);
        var bb = BollingerBandsIndicator.CalculateLatest(candles, 20, 2.0m);
        var adx = ADXIndicator.CalculateLatest(candles, 14);
        var stoch = StochasticIndicator.CalculateLatest(candles, 14, 3);
        var (supports, resistances) = SupportResistanceIndicator.CalculateLevels(candles);
        decimal vwap = VWAPIndicator.CalculateLatest(candles);

        decimal currentClose = candles[^1].Close;

        // Determine technical bias
        int bullPoints = 0;
        int bearPoints = 0;

        if (currentClose > ema20) bullPoints++; else bearPoints++;
        if (ema20 > ema50) bullPoints++; else bearPoints++;
        if (currentClose > ema200) bullPoints += 2; else bearPoints += 2;
        if (macd.Histogram > 0) bullPoints++; else bearPoints++;
        if (rsi > 50 && rsi < 70) bullPoints++;
        else if (rsi < 50 && rsi > 30) bearPoints++;
        if (adx.PlusDi > adx.MinusDi) bullPoints++; else bearPoints++;
        if (currentClose > vwap) bullPoints++; else bearPoints++;

        string bias = bullPoints >= bearPoints + 3 ? "BULLISH" : (bearPoints >= bullPoints + 3 ? "BEARISH" : "NEUTRAL");

        return new TechnicalAnalysisDto
        {
            Ema20 = Math.Round(ema20, 5),
            Ema50 = Math.Round(ema50, 5),
            Ema200 = Math.Round(ema200, 5),
            Rsi14 = rsi,
            RsiCondition = rsiCond,
            Macd = macd,
            Atr14 = atr,
            BollingerBands = bb,
            Adx = adx,
            Stochastic = stoch,
            SupportLevels = supports,
            ResistanceLevels = resistances,
            Vwap = vwap,
            OverallTechnicalBias = bias
        };
    }
}
