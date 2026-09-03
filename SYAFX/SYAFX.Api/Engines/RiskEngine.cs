using SYAFX.Api.DTOs;
using SYAFX.Api.Models;

namespace SYAFX.Api.Engines;

public class RiskEngine
{
    public static RiskInfoDto Calculate(
        decimal currentPrice,
        string signal,
        decimal atr,
        MarketStructureDto structure,
        int digits = 5)
    {
        decimal entry = currentPrice;
        decimal slDistance = Math.Max(atr * 1.5m, 0.0012m); // Minimum safety cushion

        decimal sl = 0;
        decimal tp1 = 0;
        decimal tp2 = 0;
        decimal rr = 0;
        string invalidation = string.Empty;

        if (signal == "BUY")
        {
            // Place SL below recent swing low or ATR distance
            decimal structureLow = structure.RecentLows.Count > 0 ? structure.RecentLows[^1].Price : (currentPrice - slDistance);
            sl = Math.Min(currentPrice - (atr * 1.2m), structureLow - (atr * 0.3m));

            decimal risk = entry - sl;
            if (risk <= 0) risk = slDistance;

            tp1 = entry + (risk * 1.6m);
            tp2 = entry + (risk * 2.8m);
            rr = Math.Round((tp2 - entry) / risk, 1);
            invalidation = $"Invalidated if price breaches structural support at {sl:F5}.";
        }
        else if (signal == "SELL")
        {
            // Place SL above recent swing high or ATR distance
            decimal structureHigh = structure.RecentHighs.Count > 0 ? structure.RecentHighs[^1].Price : (currentPrice + slDistance);
            sl = Math.Max(currentPrice + (atr * 1.2m), structureHigh + (atr * 0.3m));

            decimal risk = sl - entry;
            if (risk <= 0) risk = slDistance;

            tp1 = entry - (risk * 1.6m);
            tp2 = entry - (risk * 2.8m);
            rr = Math.Round((entry - tp2) / risk, 1);
            invalidation = $"Invalidated if price breaches structural ceiling at {sl:F5}.";
        }
        else // WAIT
        {
            // Conservative reference corridor
            sl = currentPrice - (atr * 1.5m);
            tp1 = currentPrice + (atr * 2.0m);
            tp2 = currentPrice + (atr * 3.5m);
            rr = 2.3m;
            invalidation = "Market in WAIT mode. No active trade execution recommended until setup triggers.";
        }

        // Calculate standard lot units for $10,000 account risking 1% ($100)
        decimal accountEquity = 10000m;
        decimal maxRiskDollar = accountEquity * 0.01m; // 1%
        decimal riskPerUnit = Math.Abs(entry - sl);
        decimal units = riskPerUnit > 0 ? Math.Round(maxRiskDollar / riskPerUnit, 0) : 1000m;

        return new RiskInfoDto
        {
            CurrentPrice = Math.Round(currentPrice, digits),
            Entry = Math.Round(entry, digits),
            StopLoss = Math.Round(sl, digits),
            TakeProfit1 = Math.Round(tp1, digits),
            TakeProfit2 = Math.Round(tp2, digits),
            RiskRewardRatio = rr,
            AtrRiskPoints = Math.Round(atr, digits),
            RecommendedPositionUnits = units,
            MaxRiskPercent = 1.0m,
            InvalidationRule = invalidation
        };
    }
}
