using FrontendBlazor.Client.Infrastructure.Auth;
using Microsoft.AspNetCore.Components;

namespace FrontendBlazor.Client.Features.Auth;

public sealed class AuthContext(
    BackendAuthClient backendAuthClient,
    NavigationManager navigation) : IDisposable
{
    private readonly SemaphoreSlim _initializationLock = new(1, 1);
    private const string EmailPasswordDisabledMessage =
        "Logowanie e-mail/haslo jest off";
    private bool _initialized;

    public event Action? Changed;

    public LocalUser? User { get; private set; }

    public bool Loading { get; private set; } = true;

    public bool IsAuthenticated => User is not null;

    public string? InitializationError { get; private set; }

    public async Task InitializeAsync()
    {
        if (_initialized)
        {
            return;
        }

        await _initializationLock.WaitAsync();

        try
        {
            if (_initialized)
            {
                return;
            }

            InitializationError = null;
            User = await backendAuthClient.GetCurrentUserAsync();
        }
        catch (Exception exception)
        {
            User = null;
            InitializationError = exception.Message;
        }
        finally
        {
            _initialized = true;
            Loading = false;
            _initializationLock.Release();
            NotifyChanged();
        }
    }

    public Task LoginAsync(string email, string password)
    {
        _ = email;
        _ = password;

        throw new InvalidOperationException(EmailPasswordDisabledMessage);
    }

    public Task RegisterAsync(
        string fullName,
        string email,
        string password)
    {
        _ = fullName;
        _ = email;
        _ = password;

        throw new InvalidOperationException(EmailPasswordDisabledMessage);
    }

    public async Task LoginWithGoogleAsync()
    {
        InitializationError = null;
        NotifyChanged();

        var redirectTo = new Uri(
            new Uri(navigation.BaseUri),
            "login").ToString();

        await backendAuthClient.RedirectToGoogleLoginAsync(redirectTo);
    }

    public async Task LogoutAsync()
    {
        await backendAuthClient.LogoutAsync();
        User = null;
        InitializationError = null;
        NotifyChanged();
    }

    public Task<string> GetIdTokenAsync(bool forceRefresh = false)
    {
        _ = forceRefresh;
        return Task.FromResult(string.Empty);
    }

    public void Dispose()
    {
        _initializationLock.Dispose();
    }

    private void NotifyChanged()
    {
        Changed?.Invoke();
    }
}
