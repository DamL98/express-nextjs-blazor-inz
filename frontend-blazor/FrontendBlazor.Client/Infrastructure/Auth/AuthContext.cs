using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Models.DTOs;
using Microsoft.AspNetCore.Components;

namespace FrontendBlazor.Client.Infrastructure.Auth;

public sealed class AuthContext(
    ApiClient apiClient,
    NavigationManager navigation) : IDisposable
{
    private bool _isInitialized;

    public event Action? Changed;

    public LocalUserDto? User { get; private set; }

    public string? Error { get; private set; }

    private void ExpireSession() { User = null; Changed?.Invoke(); }
    public void Dispose() => apiClient.SessionExpired -= ExpireSession;

    public bool IsLoading { get; private set; } = true;

    public bool IsAuthenticated => User is not null;

    public async Task InitializeAsync()
    {
        if (_isInitialized)
        {
            return;
        }

        _isInitialized = true;
        apiClient.SessionExpired += ExpireSession;

        try
        {
            User = await apiClient.ApiRequestAsync<LocalUserDto>(
                "/auth/me",
                new ApiRequestOptions
                {
                    IsBrowserCredentialRequired = true,
                });
        }
        catch (ApiException exception) when (exception.StatusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            User = null;
        }
        catch
        {
            Error = "Nie mozna sprawdzic sesji. Odswiez strone i sprobuj ponownie.";
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
