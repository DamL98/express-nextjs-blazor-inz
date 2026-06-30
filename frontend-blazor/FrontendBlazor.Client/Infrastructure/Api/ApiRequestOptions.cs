namespace FrontendBlazor.Client.Infrastructure.Api;

public sealed class ApiRequestOptions
{
    public HttpMethod Method { get; init; } = HttpMethod.Get;

    public string? Token { get; init; }

    public object? Body { get; init; }
}
