namespace FrontendBlazor.Client.Features.Auth;

public sealed class LocalUser
{
    public string Id { get; init; } = string.Empty;

    public string GoogleId { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;

    public string FullName { get; init; } = string.Empty;

    public string? AvatarUrl { get; init; }

    public bool EmailVerified { get; init; }

    public UserRole Role { get; init; } = new();
}

public sealed class UserRole
{
    public string Name { get; init; } = string.Empty;
}
