using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Models.DTOs;
using FrontendBlazor.Client.Services;
using Microsoft.AspNetCore.Components;

namespace FrontendBlazor.Client.Infrastructure.Auth;

public sealed class AuthContext(
    ApiClient apiClient,
    AuthService authentication,
    NavigationManager navigation) : IDisposable
{
    private bool _isInitialized;
    public event Action? Changed;
    public LocalUserDto? User { get; private set; }
    public string? Error { get; private set; }

    private void ExpireSession()
    {
        User = null;
        Changed?.Invoke();
    }

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
            User = await authentication.GetCurrentSessionUserAsync();
        }
        catch (ApiClientException exception) when (exception.StatusCode == System.Net.HttpStatusCode.Unauthorized)
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

    public async Task LoginLocalAsync(string email, string password)
    {
        var session = await authentication.LoginLocalAsync(email, password);
        User = session.User;
        Error = null;
        Changed?.Invoke();
    }

    public Task LoginWithGoogleAsync()
    {
        var redirectTo = new Uri(
            new Uri(navigation.BaseUri),
            "login").ToString();
        navigation.NavigateTo(authentication.GetGoogleLoginUri(redirectTo).ToString(), forceLoad: true);
        return Task.CompletedTask;
    }

    public async Task LogoutAsync()
    {
        await authentication.LogoutAsync();
        User = null;
        Changed?.Invoke();
    }
}
