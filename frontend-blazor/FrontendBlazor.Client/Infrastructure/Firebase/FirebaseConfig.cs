namespace FrontendBlazor.Client.Infrastructure.Firebase;

public sealed class FirebaseConfig
{
    public string ApiKey { get; init; } = string.Empty;

    public string AuthDomain { get; init; } = string.Empty;

    public string ProjectId { get; init; } = string.Empty;

    public string StorageBucket { get; init; } = string.Empty;

    public string MessagingSenderId { get; init; } = string.Empty;

    public string AppId { get; init; } = string.Empty;
}
