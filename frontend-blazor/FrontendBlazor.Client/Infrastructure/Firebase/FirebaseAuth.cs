using Microsoft.JSInterop;

namespace FrontendBlazor.Client.Infrastructure.Firebase;

public sealed class FirebaseAuth(
    IJSRuntime jsRuntime,
    FirebaseConfig firebaseConfig) : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _module = new(
        () => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./js/firebase-auth.js").AsTask());

    public async Task<FirebaseUser?> InitializeAsync()
    {
        var module = await _module.Value;
        var result = await module.InvokeAsync<FirebaseInteropResult>(
            "initialize",
            firebaseConfig);

        return ReadUser(result, userRequired: false);
    }

    public async Task<FirebaseUser> LoginAsync(
        string email,
        string password)
    {
        var module = await _module.Value;
        var result = await module.InvokeAsync<FirebaseInteropResult>(
            "login",
            email,
            password);

        return ReadUser(result, userRequired: true)!;
    }

    public async Task<FirebaseUser> RegisterAsync(
        string fullName,
        string email,
        string password)
    {
        var module = await _module.Value;
        var result = await module.InvokeAsync<FirebaseInteropResult>(
            "register",
            fullName,
            email,
            password);

        return ReadUser(result, userRequired: true)!;
    }

    public async Task<FirebaseUser> LoginWithGoogleAsync()
    {
        var module = await _module.Value;
        var result = await module.InvokeAsync<FirebaseInteropResult>(
            "loginWithGoogle");

        return ReadUser(result, userRequired: true)!;
    }

    public async Task LogoutAsync()
    {
        var module = await _module.Value;
        var result = await module.InvokeAsync<FirebaseInteropResult>("logout");
        EnsureSuccess(result);
    }

    public async Task<string> GetIdTokenAsync(bool forceRefresh = false)
    {
        var module = await _module.Value;
        var result = await module.InvokeAsync<FirebaseInteropResult>(
            "getIdToken",
            forceRefresh);

        EnsureSuccess(result);

        if (string.IsNullOrWhiteSpace(result.Token))
        {
            throw new FirebaseError(
                "auth/token-missing",
                "Błąd pobierania tokenu usera z firebase");
        }

        return result.Token;
    }

    public async ValueTask DisposeAsync()
    {
        if (_module.IsValueCreated)
        {
            var module = await _module.Value;
            await module.DisposeAsync();
        }
    }

    private static FirebaseUser? ReadUser(
        FirebaseInteropResult result,
        bool userRequired)
    {
        EnsureSuccess(result);

        if (userRequired && result.User is null)
        {
            throw new FirebaseError(
                "auth/user-missing",
                "Błąd pobierania danych useraz firebase");
        }

        return result.User;
    }

    private static void EnsureSuccess(FirebaseInteropResult result)
    {
        if (result.Success)
        {
            return;
        }

        throw new FirebaseError(
            result.ErrorCode ?? "auth/unknown-error",
            result.ErrorMessage ?? "Nieznany błąd z firebase");
    }

    private sealed class FirebaseInteropResult
    {
        public bool Success { get; init; }

        public FirebaseUser? User { get; init; }

        public string? Token { get; init; }

        public string? ErrorCode { get; init; }

        public string? ErrorMessage { get; init; }
    }
}
