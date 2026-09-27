using System.Text.Json.Serialization;

namespace FrontendBlazor.Client.Infrastructure.Api;

public sealed class ApiSuccess<T>
{
    [JsonPropertyName("success")]
    public bool IsSuccess { get; init; }

    public T? Data { get; init; }
}
