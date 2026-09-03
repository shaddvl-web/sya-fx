namespace SYAFX.Api.DTOs;

public class TechnicalAnalysisDto
{
    public decimal Ema20 { get; set; }
    public decimal Ema50 { get; set; }
    public decimal Ema200 { get; set; }
    public decimal Rsi14 { get; set; }
    public string RsiCondition { get; set; } = "NEUTRAL"; // OVERBOUGHT, OVERSOLD, NEUTRAL
    public MacdValueDto Macd { get; set; } = new();
    public decimal Atr14 { get; set; }
    public BollingerBandsDto BollingerBands { get; set; } = new();
    public AdxDto Adx { get; set; } = new();
    public StochasticDto Stochastic { get; set; } = new();
    public List<decimal> SupportLevels { get; set; } = new();
    public List<decimal> ResistanceLevels { get; set; } = new();
    public decimal Vwap { get; set; }
    public string OverallTechnicalBias { get; set; } = "NEUTRAL";
}

public class MacdValueDto
{
    public decimal MacdLine { get; set; }
    public decimal SignalLine { get; set; }
    public decimal Histogram { get; set; }
    public string Crossover { get; set; } = "NONE"; // BULLISH_CROSS, BEARISH_CROSS, NONE
}

public class BollingerBandsDto
{
    public decimal Upper { get; set; }
    public decimal Middle { get; set; }
    public decimal Lower { get; set; }
    public decimal Bandwidth { get; set; }
    public decimal PercentB { get; set; }
}

public class AdxDto
{
    public decimal Value { get; set; }
    public decimal PlusDi { get; set; }
    public decimal MinusDi { get; set; }
    public string TrendStrength { get; set; } = "WEAK"; // STRONG_TREND, MODERATE, WEAK/ABSENT
}

public class StochasticDto
{
    public decimal K { get; set; }
    public decimal D { get; set; }
    public string Condition { get; set; } = "NEUTRAL";
}

public class SwingPointDto
{
    public int Index { get; set; }
    public DateTime Timestamp { get; set; }
    public decimal Price { get; set; }
    public string Type { get; set; } = "HH"; // HH, HL, LH, LL
}

public class MarketStructureDto
{
    public string Structure { get; set; } = "RANGING"; // BULLISH, BEARISH, RANGING
    public decimal Confidence { get; set; }
    public List<SwingPointDto> RecentHighs { get; set; } = new();
    public List<SwingPointDto> RecentLows { get; set; } = new();
    public StructureBreakDto? Bos { get; set; }
    public StructureBreakDto? Choch { get; set; }
    public decimal MajorResistance { get; set; }
    public decimal MajorSupport { get; set; }
    public string Explanation { get; set; } = string.Empty;
}

public class StructureBreakDto
{
    public bool Detected { get; set; }
    public string Type { get; set; } = "BOS"; // BOS, CHOCH
    public string Direction { get; set; } = "BULLISH"; // BULLISH, BEARISH
    public decimal BreakoutLevel { get; set; }
    public int CandleIndex { get; set; }
    public DateTime Timestamp { get; set; }
    public decimal VolumeRatio { get; set; }
    public string ConfirmationReason { get; set; } = string.Empty;
}

public class PatternDetectionDto
{
    public string Pattern { get; set; } = string.Empty;
    public string Direction { get; set; } = "BULLISH"; // BULLISH, BEARISH, NEUTRAL
    public decimal Confidence { get; set; }
    public decimal Quality { get; set; }
    public int StartIndex { get; set; }
    public int EndIndex { get; set; }
    public string ValidationStatus { get; set; } = "VALIDATED"; // VALIDATED, PENDING, INVALIDATED
    public decimal TargetPrice { get; set; }
    public decimal InvalidationLevel { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class ConfluenceSignalDto
{
    public string Symbol { get; set; } = string.Empty;
    public string Timeframe { get; set; } = "M15";
    public decimal TechnicalScore { get; set; }
    public decimal StructureScore { get; set; }
    public decimal PatternScore { get; set; }
    public decimal MomentumScore { get; set; }
    public decimal RiskScore { get; set; }
    public decimal FinalScore { get; set; }
    public string Signal { get; set; } = "WAIT"; // BUY, SELL, WAIT
    public string Strength { get; set; } = "MODERATE"; // STRONG, MODERATE, WEAK
    public List<string> ConfluenceFactors { get; set; } = new();
    public List<string> ConflictingFactors { get; set; } = new();
    public DateTime Timestamp { get; set; }
}

public class RiskInfoDto
{
    public decimal CurrentPrice { get; set; }
    public decimal Entry { get; set; }
    public decimal StopLoss { get; set; }
    public decimal TakeProfit1 { get; set; }
    public decimal TakeProfit2 { get; set; }
    public decimal RiskRewardRatio { get; set; }
    public decimal AtrRiskPoints { get; set; }
    public decimal RecommendedPositionUnits { get; set; }
    public decimal MaxRiskPercent { get; set; } = 1.0m;
    public string InvalidationRule { get; set; } = string.Empty;
}

public class FullAnalysisDto
{
    public string Symbol { get; set; } = string.Empty;
    public string Timeframe { get; set; } = "M15";
    public decimal CurrentPrice { get; set; }
    public MarketQuoteDto Quote { get; set; } = new();
    public TechnicalAnalysisDto Technical { get; set; } = new();
    public MarketStructureDto Structure { get; set; } = new();
    public List<PatternDetectionDto> Patterns { get; set; } = new();
    public ConfluenceSignalDto Signal { get; set; } = new();
    public RiskInfoDto Risk { get; set; } = new();
    public DateTime AnalysisTimestamp { get; set; } = DateTime.UtcNow;
}
