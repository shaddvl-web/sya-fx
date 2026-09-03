using Microsoft.EntityFrameworkCore;
using SYAFX.Api.Data;
using SYAFX.Api.DTOs;
using SYAFX.Api.Engines;
using SYAFX.Api.Models;

namespace SYAFX.Api.Services;

public class AnalysisCoordinatorService
{
    private readonly IMarketDataProvider _marketData;
    private readonly SyaDbContext _db;
    private readonly ILogger<AnalysisCoordinatorService> _logger;

    public AnalysisCoordinatorService(IMarketDataProvider marketData, SyaDbContext db, ILogger<AnalysisCoordinatorService> logger)
    {
        _marketData = marketData;
        _db = db;
        _logger = logger;
    }

    public async Task<FullAnalysisDto> GetFullAnalysisAsync(string symbol, string timeframe = "M15", CancellationToken ct = default)
    {
        var quote = await _marketData.GetQuoteAsync(symbol, ct);
        var candles = await _marketData.GetCandlesAsync(symbol, timeframe, 120, ct);

        if (candles.Count == 0)
        {
            throw new InvalidOperationException($"No candle data available for {symbol}");
        }

        var technical = TechnicalEngine.Analyze(candles);
        var structure = MarketStructureEngine.Analyze(candles);
        var patterns = PatternEngine.DetectPatterns(candles);
        var signal = ConfluenceEngine.Evaluate(symbol, timeframe, candles, technical, structure, patterns);

        decimal currentPrice = candles[^1].Close;
        var meta = await _db.MarketSymbols.FirstOrDefaultAsync(s => s.Symbol == symbol, ct);
        int digits = meta?.Digits ?? 5;

        var risk = RiskEngine.Calculate(currentPrice, signal.Signal, technical.Atr14, structure, digits);

        var fullAnalysis = new FullAnalysisDto
        {
            Symbol = symbol,
            Timeframe = timeframe,
            CurrentPrice = currentPrice,
            Quote = quote,
            Technical = technical,
            Structure = structure,
            Patterns = patterns,
            Signal = signal,
            Risk = risk,
            AnalysisTimestamp = DateTime.UtcNow
        };

        // Record signal to database if not redundant
        try
        {
            var lastSignal = await _db.SignalRecords
                .Where(s => s.Symbol == symbol && s.Timeframe == timeframe)
                .OrderByDescending(s => s.Timestamp)
                .FirstOrDefaultAsync(ct);

            // Record if new or older than 15 mins
            if (lastSignal == null || (DateTime.UtcNow - lastSignal.Timestamp).TotalMinutes >= 15 || lastSignal.SignalType != signal.Signal)
            {
                _db.SignalRecords.Add(new SignalRecord
                {
                    Symbol = symbol,
                    Timeframe = timeframe,
                    SignalType = signal.Signal,
                    Score = signal.FinalScore,
                    Confidence = signal.FinalScore,
                    Entry = risk.Entry,
                    StopLoss = risk.StopLoss,
                    TakeProfit1 = risk.TakeProfit1,
                    TakeProfit2 = risk.TakeProfit2,
                    RiskRewardRatio = risk.RiskRewardRatio,
                    Timestamp = DateTime.UtcNow,
                    Result = "OPEN",
                    StrategyVersion = "v1.0-CONFLUENCE",
                    TechnicalScore = signal.TechnicalScore,
                    StructureScore = signal.StructureScore,
                    PatternScore = signal.PatternScore,
                    MomentumScore = signal.MomentumScore,
                    RiskScore = signal.RiskScore,
                    Notes = string.Join(" | ", signal.ConfluenceFactors.Take(2))
                });
                await _db.SaveChangesAsync(ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed recording signal to database for {Symbol}", symbol);
        }

        return fullAnalysis;
    }
}
