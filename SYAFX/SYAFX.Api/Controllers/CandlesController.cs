using Microsoft.AspNetCore.Mvc;
using SYAFX.Api.DTOs;
using SYAFX.Api.Engines;

namespace SYAFX.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CandlesController : ControllerBase
{
    private readonly IMarketDataProvider _marketData;

    public CandlesController(IMarketDataProvider marketData)
    {
        _marketData = marketData;
    }

    [HttpGet("{symbol}")]
    public async Task<ActionResult<ApiResponse<CandleHistoryResponse>>> GetCandles(
        string symbol,
        [FromQuery] string timeframe = "M15",
        [FromQuery] int limit = 120,
        CancellationToken ct = default)
    {
        try
        {
            var rawCandles = await _marketData.GetCandlesAsync(symbol, timeframe, limit, ct);
            var dtos = rawCandles.Select(c => new CandleDto
            {
                Timestamp = c.Timestamp,
                Open = c.Open,
                High = c.High,
                Low = c.Low,
                Close = c.Close,
                Volume = c.Volume
            }).ToList();

            var response = new CandleHistoryResponse
            {
                Symbol = symbol,
                Timeframe = timeframe,
                Count = dtos.Count,
                Candles = dtos,
                Source = _marketData.GetConnectionStatus()
            };

            return Ok(ApiResponse<CandleHistoryResponse>.Ok(response));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<CandleHistoryResponse>.Fail("CANDLE_FETCH_ERROR", ex.Message));
        }
    }
}
