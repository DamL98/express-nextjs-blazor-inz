using System.Text.Json;

namespace FrontendBlazor.Client.Infrastructure.Api;

public sealed class ApiError
{
    public string Code { get; init; } = string.Empty;

    public string Message { get; init; } = string.Empty;

    public JsonElement? Details { get; init; }
}
