using Microsoft.AspNetCore.Mvc;
using SYAFX.Api.DTOs;
using SYAFX.Api.Engines;

namespace SYAFX.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MarketsController : ControllerBase
{
    private readonly IMarketDataProvider _marketData;

    public MarketsController(IMarketDataProvider marketData)
    {
        _marketData = marketData;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<MarketQuoteDto>>>> GetAllMarkets(CancellationToken ct)
    {
        var quotes = await _marketData.GetQuotesAsync(ct);
        return Ok(ApiResponse<List<MarketQuoteDto>>.Ok(quotes));
    }

    [HttpGet("{symbol}")]
    public async Task<ActionResult<ApiResponse<MarketQuoteDto>>> GetMarket(string symbol, CancellationToken ct)
    {
        try
        {
            var quote = await _marketData.GetQuoteAsync(symbol, ct);
            return Ok(ApiResponse<MarketQuoteDto>.Ok(quote));
        }
        catch (Exception ex)
        {
            return NotFound(ApiResponse<MarketQuoteDto>.Fail("SYMBOL_NOT_FOUND", ex.Message));
        }
    }
}
