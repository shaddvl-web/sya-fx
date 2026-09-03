using System.Net;
using System.Text.Json;
using SYAFX.Api.DTOs;

namespace SYAFX.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        string code = exception switch
        {
            ArgumentException => "INVALID_ARGUMENT",
            KeyNotFoundException => "RESOURCE_NOT_FOUND",
            TimeoutException => "GATEWAY_TIMEOUT",
            _ => "INTERNAL_SERVER_ERROR"
        };

        var response = ApiResponse<object>.Fail(code, exception.Message);
        var json = JsonSerializer.Serialize(response);
        return context.Response.WriteAsync(json);
    }
}
