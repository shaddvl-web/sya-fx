namespace SYAFX.Api.DTOs;

public class MarketQuoteDto
{
    public string Symbol { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public decimal Bid { get; set; }
    public decimal Ask { get; set; }
    public decimal LastPrice { get; set; }
    public decimal Change24h { get; set; }
    public decimal Change24hPercent { get; set; }
    public decimal High24h { get; set; }
    public decimal Low24h { get; set; }
    public decimal Spread { get; set; }
    public decimal Volume24h { get; set; }
    public string SessionStatus { get; set; } = "OPEN"; // LONDON, NEW_YORK, TOKYO, SYDNEY, CLOSED
    public DateTime LastUpdated { get; set; }
}

public class CandleDto
{
    public DateTime Timestamp { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
    public decimal Volume { get; set; }
}

public class CandleHistoryResponse
{
    public string Symbol { get; set; } = string.Empty;
    public string Timeframe { get; set; } = "M15";
    public int Count { get; set; }
    public List<CandleDto> Candles { get; set; } = new();
    public string Source { get; set; } = "MARKET_FEED";
}
