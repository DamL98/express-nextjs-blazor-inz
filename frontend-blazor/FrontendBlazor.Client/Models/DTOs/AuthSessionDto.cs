namespace FrontendBlazor.Client.Models.DTOs;

public sealed class AuthSessionDto
{
    public LocalUserDto User { get; init; } = new();
}
