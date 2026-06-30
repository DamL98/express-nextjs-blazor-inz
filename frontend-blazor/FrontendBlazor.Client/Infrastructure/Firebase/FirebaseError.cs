namespace FrontendBlazor.Client.Infrastructure.Firebase;

public sealed class FirebaseError(string code, string message)
    : Exception(message)
{
    public string Code { get; } = code;
}
