using Microsoft.AspNetCore.Mvc;
using SYAFX.Api.DTOs;
using SYAFX.Api.Services;

namespace SYAFX.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StructureController : ControllerBase
{
    private readonly AnalysisCoordinatorService _coordinator;

    public StructureController(AnalysisCoordinatorService coordinator)
    {
        _coordinator = coordinator;
    }

    [HttpGet("{symbol}")]
    public async Task<ActionResult<ApiResponse<MarketStructureDto>>> GetStructure(
        string symbol,
        [FromQuery] string timeframe = "M15",
        CancellationToken ct = default)
    {
        try
        {
            var analysis = await _coordinator.GetFullAnalysisAsync(symbol, timeframe, ct);
            return Ok(ApiResponse<MarketStructureDto>.Ok(analysis.Structure));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<MarketStructureDto>.Fail("STRUCTURE_ERROR", ex.Message));
        }
    }
}

[ApiController]
[Route("api/[controller]")]
public class PatternsController : ControllerBase
{
    private readonly AnalysisCoordinatorService _coordinator;

    public PatternsController(AnalysisCoordinatorService coordinator)
    {
        _coordinator = coordinator;
    }

    [HttpGet("{symbol}")]
    public async Task<ActionResult<ApiResponse<List<PatternDetectionDto>>>> GetPatterns(
        string symbol,
        [FromQuery] string timeframe = "M15",
        CancellationToken ct = default)
    {
        try
        {
            var analysis = await _coordinator.GetFullAnalysisAsync(symbol, timeframe, ct);
            return Ok(ApiResponse<List<PatternDetectionDto>>.Ok(analysis.Patterns));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<List<PatternDetectionDto>>.Fail("PATTERN_ERROR", ex.Message));
        }
    }
}

[ApiController]
[Route("api/[controller]")]
public class SignalsController : ControllerBase
{
    private readonly AnalysisCoordinatorService _coordinator;

    public SignalsController(AnalysisCoordinatorService coordinator)
    {
        _coordinator = coordinator;
    }

    [HttpGet("{symbol}")]
    public async Task<ActionResult<ApiResponse<ConfluenceSignalDto>>> GetSignal(
        string symbol,
        [FromQuery] string timeframe = "M15",
        CancellationToken ct = default)
    {
        try
        {
            var analysis = await _coordinator.GetFullAnalysisAsync(symbol, timeframe, ct);
            return Ok(ApiResponse<ConfluenceSignalDto>.Ok(analysis.Signal));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<ConfluenceSignalDto>.Fail("SIGNAL_ERROR", ex.Message));
        }
    }
}
