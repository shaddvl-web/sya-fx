using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SYAFX.Api.Data;
using SYAFX.Api.DTOs;
using SYAFX.Api.Engines;
using SYAFX.Api.Models;
using SYAFX.Api.Services;

namespace SYAFX.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HistoryController : ControllerBase
{
    private readonly SyaDbContext _db;

    public HistoryController(SyaDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<SignalRecord>>>> GetSignalHistory(
        [FromQuery] string? symbol,
        [FromQuery] string? signalType,
        [FromQuery] int limit = 50,
        CancellationToken ct = default)
    {
        var query = _db.SignalRecords.AsQueryable();

        if (!string.IsNullOrWhiteSpace(symbol))
        {
            query = query.Where(s => s.Symbol == symbol);
        }

        if (!string.IsNullOrWhiteSpace(signalType))
        {
            query = query.Where(s => s.SignalType == signalType.ToUpperInvariant());
        }

        var list = await query
            .OrderByDescending(s => s.Timestamp)
            .Take(limit)
            .ToListAsync(ct);

        return Ok(ApiResponse<List<SignalRecord>>.Ok(list));
    }
}

[ApiController]
[Route("api/[controller]")]
public class BacktestController : ControllerBase
{
    private readonly IMarketDataProvider _marketData;
    private readonly BacktestEngine _backtestEngine;

    public BacktestController(IMarketDataProvider marketData, BacktestEngine backtestEngine)
    {
        _marketData = marketData;
        _backtestEngine = backtestEngine;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<BacktestResultDto>>> RunBacktest(
        [FromBody] BacktestRequestDto request,
        CancellationToken ct)
    {
        try
        {
            var candles = await _marketData.GetCandlesAsync(request.Symbol, request.Timeframe, 200, ct);
            var result = await _backtestEngine.RunBacktestAsync(request, candles);
            return Ok(ApiResponse<BacktestResultDto>.Ok(result));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<BacktestResultDto>.Fail("BACKTEST_ERROR", ex.Message));
        }
    }
}

[ApiController]
[Route("api/ai")]
public class AiController : ControllerBase
{
    private readonly AnalysisCoordinatorService _coordinator;
    private readonly AiAnalystService _aiService;

    public AiController(AnalysisCoordinatorService coordinator, AiAnalystService aiService)
    {
        _coordinator = coordinator;
        _aiService = aiService;
    }

    [HttpPost("analyze")]
    public async Task<ActionResult<ApiResponse<AiAnalysisResponseDto>>> Analyze(
        [FromBody] AiAnalysisRequestDto request,
        CancellationToken ct)
    {
        try
        {
            var analysis = await _coordinator.GetFullAnalysisAsync(request.Symbol, request.Timeframe, ct);
            var aiResult = await _aiService.AnalyzeAsync(analysis, ct);
            return Ok(ApiResponse<AiAnalysisResponseDto>.Ok(aiResult));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<AiAnalysisResponseDto>.Fail("AI_ANALYSIS_ERROR", ex.Message));
        }
    }
}
