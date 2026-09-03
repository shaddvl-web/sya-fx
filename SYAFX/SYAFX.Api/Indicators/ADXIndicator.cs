using SYAFX.Api.DTOs;
using SYAFX.Api.Models;

namespace SYAFX.Api.Indicators;

public class ADXIndicator
{
    public static AdxDto CalculateLatest(IReadOnlyList<Candle> candles, int period = 14)
    {
        if (candles.Count < (period * 2))
        {
            return new AdxDto { Value = 20, PlusDi = 20, MinusDi = 20, TrendStrength = "WEAK/ABSENT" };
        }

        var plusDm = new List<decimal>(candles.Count);
        var minusDm = new List<decimal>(candles.Count);
        var tr = new List<decimal>(candles.Count);

        plusDm.Add(0);
        minusDm.Add(0);
        tr.Add(candles[0].High - candles[0].Low);

        for (int i = 1; i < candles.Count; i++)
        {
            decimal highDiff = candles[i].High - candles[i - 1].High;
            decimal lowDiff = candles[i - 1].Low - candles[i].Low;

            plusDm.Add(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
            minusDm.Add(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

            decimal hl = candles[i].High - candles[i].Low;
            decimal hc = Math.Abs(candles[i].High - candles[i - 1].Close);
            decimal lc = Math.Abs(candles[i].Low - candles[i - 1].Close);
            tr.Add(Math.Max(hl, Math.Max(hc, lc)));
        }

        // Smoothed sums over period
        decimal trSum = 0, pDmSum = 0, mDmSum = 0;
        for (int i = 1; i <= period; i++)
        {
            trSum += tr[i];
            pDmSum += plusDm[i];
            mDmSum += minusDm[i];
        }

        var dxList = new List<decimal>();
        decimal pDi = trSum > 0 ? (pDmSum / trSum) * 100 : 0;
        decimal mDi = trSum > 0 ? (mDmSum / trSum) * 100 : 0;
        decimal diDiff = Math.Abs(pDi - mDi);
        decimal diSum = pDi + mDi;
        dxList.Add(diSum > 0 ? (diDiff / diSum) * 100 : 0);

        for (int i = period + 1; i < candles.Count; i++)
        {
            trSum = trSum - (trSum / period) + tr[i];
            pDmSum = pDmSum - (pDmSum / period) + plusDm[i];
            mDmSum = mDmSum - (mDmSum / period) + minusDm[i];

            pDi = trSum > 0 ? (pDmSum / trSum) * 100 : 0;
            mDi = trSum > 0 ? (mDmSum / trSum) * 100 : 0;

            diDiff = Math.Abs(pDi - mDi);
            diSum = pDi + mDi;
            dxList.Add(diSum > 0 ? (diDiff / diSum) * 100 : 0);
        }

        decimal adx = 0;
        if (dxList.Count >= period)
        {
            int dxStart = dxList.Count - period;
            decimal sum = 0;
            for (int i = dxStart; i < dxList.Count; i++) sum += dxList[i];
            adx = sum / period;
        }
        else if (dxList.Count > 0)
        {
            adx = dxList[^1];
        }

        string strength = adx >= 25 ? (adx >= 40 ? "STRONG_TREND" : "MODERATE") : "WEAK/ABSENT";

        return new AdxDto
        {
            Value = Math.Round(adx, 2),
            PlusDi = Math.Round(pDi, 2),
            MinusDi = Math.Round(mDi, 2),
            TrendStrength = strength
        };
    }
}
