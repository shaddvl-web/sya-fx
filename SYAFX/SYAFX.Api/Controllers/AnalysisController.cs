using Microsoft.AspNetCore.Mvc;
using SYAFX.Api.DTOs;
using SYAFX.Api.Services;

namespace SYAFX.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalysisController : ControllerBase
{
    private readonly AnalysisCoordinatorService _coordinator;

    public AnalysisController(AnalysisCoordinatorService coordinator)
    {
        _coordinator = coordinator;
    }

    [HttpGet("{symbol}")]
    public async Task<ActionResult<ApiResponse<FullAnalysisDto>>> GetAnalysis(
        string symbol,
        [FromQuery] string timeframe = "M15",
        CancellationToken ct = default)
    {
        try
        {
            var analysis = await _coordinator.GetFullAnalysisAsync(symbol, timeframe, ct);
            return Ok(ApiResponse<FullAnalysisDto>.Ok(analysis));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<FullAnalysisDto>.Fail("ANALYSIS_ERROR", ex.Message));
        }
    }
}
