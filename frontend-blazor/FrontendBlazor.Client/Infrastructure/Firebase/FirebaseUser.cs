namespace FrontendBlazor.Client.Infrastructure.Firebase;

public sealed class FirebaseUser
{
    public string Uid { get; init; } = string.Empty;

    public string? Email { get; init; }

    public string? DisplayName { get; init; }

    public string? PhotoURL { get; init; }

    public bool EmailVerified { get; init; }
}
