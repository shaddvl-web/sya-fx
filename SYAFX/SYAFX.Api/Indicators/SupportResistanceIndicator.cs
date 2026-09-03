using SYAFX.Api.Models;

namespace SYAFX.Api.Indicators;

public class SupportResistanceIndicator
{
    public record LevelCluster(decimal Price, int TouchCount, bool IsResistance);

    public static (List<decimal> Supports, List<decimal> Resistances) CalculateLevels(IReadOnlyList<Candle> candles, decimal pipTolerance = 0.0015m)
    {
        var supports = new List<decimal>();
        var resistances = new List<decimal>();

        if (candles.Count < 10) return (supports, resistances);

        decimal currentPrice = candles[^1].Close;
        var pivotHighs = new List<decimal>();
        var pivotLows = new List<decimal>();

        // Look for local pivots (window of 3 candles on each side)
        for (int i = 3; i < candles.Count - 3; i++)
        {
            bool isHigh = true;
            bool isLow = true;

            for (int j = i - 3; j <= i + 3; j++)
            {
                if (j == i) continue;
                if (candles[j].High > candles[i].High) isHigh = false;
                if (candles[j].Low < candles[i].Low) isLow = false;
            }

            if (isHigh) pivotHighs.Add(candles[i].High);
            if (isLow) pivotLows.Add(candles[i].Low);
        }

        // Cluster pivot highs (Resistances above current price or recent major ceilings)
        var groupedHighs = ClusterLevels(pivotHighs, pipTolerance);
        resistances = groupedHighs
            .Where(h => h.Price >= currentPrice * 0.998m)
            .OrderBy(h => h.Price)
            .Take(4)
            .Select(h => Math.Round(h.Price, 5))
            .ToList();

        // Cluster pivot lows (Supports below current price or recent major floors)
        var groupedLows = ClusterLevels(pivotLows, pipTolerance);
        supports = groupedLows
            .Where(l => l.Price <= currentPrice * 1.002m)
            .OrderByDescending(l => l.Price)
            .Take(4)
            .Select(l => Math.Round(l.Price, 5))
            .ToList();

        // Fallback if sparse pivots
        if (resistances.Count == 0)
        {
            resistances.Add(Math.Round(candles.Max(c => c.High), 5));
        }
        if (supports.Count == 0)
        {
            supports.Add(Math.Round(candles.Min(c => c.Low), 5));
        }

        return (supports, resistances);
    }

    private static List<LevelCluster> ClusterLevels(List<decimal> rawLevels, decimal tolerance)
    {
        var clusters = new List<LevelCluster>();
        foreach (var price in rawLevels)
        {
            int idx = clusters.FindIndex(c => Math.Abs(c.Price - price) <= tolerance);
            if (idx >= 0)
            {
                var existing = clusters[idx];
                decimal newPrice = (existing.Price * existing.TouchCount + price) / (existing.TouchCount + 1);
                clusters[idx] = new LevelCluster(newPrice, existing.TouchCount + 1, existing.IsResistance);
            }
            else
            {
                clusters.Add(new LevelCluster(price, 1, true));
            }
        }
        return clusters.OrderByDescending(c => c.TouchCount).ToList();
    }
}
