using FrontendBlazor.Client.Features.Auth.DTOs;
using FrontendBlazor.Client.Infrastructure.Api;
using Microsoft.AspNetCore.Components;

namespace FrontendBlazor.Client.Features.Auth;

public sealed class AuthContext(
    ApiClient apiClient,
    NavigationManager navigation) : IDisposable
{
    private readonly SemaphoreSlim _initializationLock = new(1, 1);
    private bool _isInitialized;

    public event Action? Changed;

    public LocalUserDto? User { get; private set; }

    public bool IsLoading { get; private set; } = true;

    public bool IsAuthenticated => User is not null;

    public async Task InitializeAsync()
    {
        if (_isInitialized)
        {
            return;
        }

        await _initializationLock.WaitAsync();

        try
        {
            if (_isInitialized)
            {
                return;
            }

            User = await apiClient.ApiRequestAsync<LocalUserDto>(
                "/auth/me",
                BrowserCredentialRequest);
        }
        catch (Exception)
        {
            User = null;
        }
        finally
        {
            _isInitialized = true;
            IsLoading = false;
            _initializationLock.Release();
            NotifyChanged();
        }
    }

    public Task LoginWithGoogleAsync()
    {
        NotifyChanged();

        var redirectTo = new Uri(
            new Uri(navigation.BaseUri),
            "login").ToString();

        var loginUrl = new Uri(apiClient.BaseAddress, "auth/google/start");
        var builder = new UriBuilder(loginUrl)
        {
            Query = $"redirectTo={Uri.EscapeDataString(redirectTo)}",
        };

        navigation.NavigateTo(builder.Uri.ToString(), forceLoad: true);
        return Task.CompletedTask;
    }

    public async Task LogoutAsync()
    {
        await apiClient.ApiRequestAsync<LogoutResult>(
            "/auth/logout",
            new ApiRequestOptions
            {
                Method = HttpMethod.Post,
                IsBrowserCredentialRequired = true,
            });
        User = null;
        NotifyChanged();
    }

    public void Dispose()
    {
        _initializationLock.Dispose();
    }

    private void NotifyChanged()
    {
        Changed?.Invoke();
    }

    private static ApiRequestOptions BrowserCredentialRequest { get; } = new()
    {
        IsBrowserCredentialRequired = true,
    };

    private sealed record LogoutResult(bool LoggedOut);
}
