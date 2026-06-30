namespace FrontendBlazor.Client.Infrastructure.Api;

public sealed class ApiResponse<T>
{
    public bool Success { get; init; }

    public T? Data { get; init; }

    public ApiError? Error { get; init; }
}
