using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Models.DTOs;
using Microsoft.AspNetCore.Components;

namespace FrontendBlazor.Client.Infrastructure.Auth;

public sealed class AuthContext(
    ApiClient apiClient,
    NavigationManager navigation)
{
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

        _isInitialized = true;

        try
        {
            User = await apiClient.ApiRequestAsync<LocalUserDto>(
                "/auth/me",
                new ApiRequestOptions
                {
                    IsBrowserCredentialRequired = true,
                });
        }
        catch
        {
            User = null;
        }
        finally
        {
            IsLoading = false;
            Changed?.Invoke();
        }
    }

    public Task LoginWithGoogleAsync()
    {
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
        await apiClient.ApiRequestAsync<LogoutResultDto>(
            "/auth/logout",
            new ApiRequestOptions
            {
                Method = HttpMethod.Post,
                IsBrowserCredentialRequired = true,
            });
        User = null;
        Changed?.Invoke();
    }
}
