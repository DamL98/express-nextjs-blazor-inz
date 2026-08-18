using System.Text.Json;

namespace FrontendBlazor.Client.Infrastructure.Api;

public sealed class ProblemDetailsDto
{
    public string Type { get; init; } = "about:blank";

    public string Title { get; init; } = string.Empty;

    public int Status { get; init; }

    public string? Detail { get; init; }

    public string? Instance { get; init; }

    public string? Code { get; init; }

    public JsonElement? Errors { get; init; }

    public JsonElement? Details { get; init; }
}
