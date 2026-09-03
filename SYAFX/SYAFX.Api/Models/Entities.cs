namespace SYAFX.Api.Models;

public class MarketSymbol
{
    public int Id { get; set; }
    public string Symbol { get; set; } = string.Empty; // e.g. "EUR_USD" or "EUR/USD"
    public string BaseCurrency { get; set; } = string.Empty;
    public string QuoteCurrency { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public int Digits { get; set; } = 5;
    public decimal PipSize { get; set; } = 0.0001m;
    public decimal TypicalSpread { get; set; } = 0.8m;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Candle
{
    public long Id { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public string Timeframe { get; set; } = "M15";
    public DateTime Timestamp { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
    public decimal Volume { get; set; }
}

public class SignalRecord
{
    public int Id { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public string Timeframe { get; set; } = "M15";
    public string SignalType { get; set; } = "WAIT"; // BUY, SELL, WAIT
    public decimal Score { get; set; }
    public decimal Confidence { get; set; }
    public decimal Entry { get; set; }
    public decimal StopLoss { get; set; }
    public decimal TakeProfit1 { get; set; }
    public decimal TakeProfit2 { get; set; }
    public decimal RiskRewardRatio { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string Result { get; set; } = "OPEN"; // OPEN, WIN, LOSS, EXPIRED, CANCELLED
    public string StrategyVersion { get; set; } = "v1.0-CONFLUENCE";
    public decimal TechnicalScore { get; set; }
    public decimal StructureScore { get; set; }
    public decimal PatternScore { get; set; }
    public decimal MomentumScore { get; set; }
    public decimal RiskScore { get; set; }
    public string? Notes { get; set; }
}

public class BacktestRecord
{
    public int Id { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public string Timeframe { get; set; } = "M15";
    public string Strategy { get; set; } = "CONFLUENCE";
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal InitialBalance { get; set; }
    public decimal FinalBalance { get; set; }
    public decimal NetProfit { get; set; }
    public int TotalTrades { get; set; }
    public int Wins { get; set; }
    public int Losses { get; set; }
    public decimal WinRate { get; set; }
    public decimal ProfitFactor { get; set; }
    public decimal MaxDrawdown { get; set; }
    public decimal AverageRR { get; set; }
    public decimal SharpeRatio { get; set; }
    public int LongestLosingStreak { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? DetailsJson { get; set; }
}

public class AiAnalysisRecord
{
    public int Id { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public string Timeframe { get; set; } = "M15";
    public decimal CurrentPrice { get; set; }
    public string Trend { get; set; } = "RANGING";
    public string Signal { get; set; } = "WAIT";
    public decimal Confidence { get; set; }
    public string Summary { get; set; } = string.Empty;
    public string ReasonsJson { get; set; } = "[]";
    public string RisksJson { get; set; } = "[]";
    public string InvalidationsJson { get; set; } = "[]";
    public string Recommendation { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class TerminalSetting
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = "Trader";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
