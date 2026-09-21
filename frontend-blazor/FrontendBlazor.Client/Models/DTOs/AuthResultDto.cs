namespace FrontendBlazor.Client.Models.DTOs;

public sealed class AuthResultDto
{
    public string Message { get; init; } = string.Empty;
    public string AuthorizationUrl { get; init; } = string.Empty;
}
