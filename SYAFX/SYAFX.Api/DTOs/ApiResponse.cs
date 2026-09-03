namespace SYAFX.Api.DTOs;

public class ApiResponse<T>
{
    public bool Success { get; set; } = true;
    public T? Data { get; set; }
    public ApiError? Error { get; set; }
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("o");

    public static ApiResponse<T> Ok(T data) => new()
    {
        Success = true,
        Data = data,
        Timestamp = DateTime.UtcNow.ToString("o")
    };

    public static ApiResponse<T> Fail(string code, string message) => new()
    {
        Success = false,
        Error = new ApiError { Code = code, Message = message },
        Timestamp = DateTime.UtcNow.ToString("o")
    };
}

public class ApiError
{
    public string Code { get; set; } = "UNKNOWN_ERROR";
    public string Message { get; set; } = string.Empty;
}
