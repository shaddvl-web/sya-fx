namespace SYAFX.Api.DTOs;

public class BacktestRequestDto
{
    public string Symbol { get; set; } = "EUR_USD";
    public string Timeframe { get; set; } = "M15";
    public string Strategy { get; set; } = "CONFLUENCE"; // CONFLUENCE, TREND_EMA, BREAKOUT_BOS, MEAN_REVERSION
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal InitialBalance { get; set; } = 10000m;
    public decimal RiskPerTradePercent { get; set; } = 1.0m;
}

public class BacktestTradeDto
{
    public int Id { get; set; }
    public DateTime EntryTime { get; set; }
    public DateTime ExitTime { get; set; }
    public string Type { get; set; } = "BUY"; // BUY, SELL
    public decimal EntryPrice { get; set; }
    public decimal ExitPrice { get; set; }
    public decimal StopLoss { get; set; }
    public decimal TakeProfit { get; set; }
    public decimal ProfitLoss { get; set; }
    public decimal ProfitLossPercent { get; set; }
    public decimal BalanceAfter { get; set; }
    public string ExitReason { get; set; } = "TP"; // TP, SL, TIMEOUT
}

public class EquityPointDto
{
    public DateTime Timestamp { get; set; }
    public decimal Equity { get; set; }
    public decimal DrawdownPercent { get; set; }
}

public class BacktestResultDto
{
    public string Symbol { get; set; } = string.Empty;
    public string Timeframe { get; set; } = string.Empty;
    public string Strategy { get; set; } = string.Empty;
    public int TotalTrades { get; set; }
    public int Wins { get; set; }
    public int Losses { get; set; }
    public decimal WinRate { get; set; }
    public decimal ProfitFactor { get; set; }
    public decimal NetProfit { get; set; }
    public decimal NetProfitPercent { get; set; }
    public decimal MaxDrawdownPercent { get; set; }
    public decimal AverageRiskReward { get; set; }
    public decimal SharpeRatio { get; set; }
    public int LongestLosingStreak { get; set; }
    public int LongestWinningStreak { get; set; }
    public decimal InitialBalance { get; set; }
    public decimal FinalBalance { get; set; }
    public List<EquityPointDto> EquityCurve { get; set; } = new();
    public List<BacktestTradeDto> Trades { get; set; } = new();
}

public class AiAnalysisRequestDto
{
    public string Symbol { get; set; } = "EUR_USD";
    public string Timeframe { get; set; } = "M15";
}

public class AiAnalysisResponseDto
{
    public string Symbol { get; set; } = string.Empty;
    public string Timeframe { get; set; } = string.Empty;
    public decimal CurrentPrice { get; set; }
    public string Summary { get; set; } = string.Empty;
    public string Trend { get; set; } = "BULLISH"; // BULLISH, BEARISH, RANGING
    public string Signal { get; set; } = "BUY"; // BUY, SELL, WAIT
    public decimal Confidence { get; set; }
    public List<string> Reasons { get; set; } = new();
    public List<string> Risks { get; set; } = new();
    public List<string> Invalidations { get; set; } = new();
    public string Recommendation { get; set; } = string.Empty;
    
    // Explicit 3-tier distinction required by Section 9
    public List<string> Facts { get; set; } = new();
    public List<string> Analysis { get; set; } = new();
    public List<string> Uncertainties { get; set; } = new();

    public string ModelUsed { get; set; } = "qwen/qwen3.6-27b";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
