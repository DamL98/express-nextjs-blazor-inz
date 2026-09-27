using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Models.DTOs;

namespace FrontendBlazor.Client.Services;

public sealed class AuthService(ApiClient api)
{
    public Task<LocalUserDto> GetCurrentSessionUserAsync() =>
        api.ApiRequestAsync<LocalUserDto>("/auth/me", new ApiRequestOptions
        {
            IsBrowserCredentialRequired = true,
        });

    public Task<AuthSessionDto> LoginLocalAsync(string email, string password) =>
        PostAsync<AuthSessionDto>("/auth/login", new LoginRequest(email, password));

    public Task<LogoutResultDto> LogoutAsync() => PostAsync<LogoutResultDto>("/auth/logout");

    public Task<AuthResultDto> RegisterAsync(AccountEmailRequest request) =>
        PostAsync<AuthResultDto>("/auth/register", request);

    public Task<AuthResultDto> RequestPasswordResetAsync(AccountEmailRequest request) =>
        PostAsync<AuthResultDto>("/auth/password/forgot", request);

    public Task<AuthResultDto> RequestVerificationAsync(AccountEmailRequest request) =>
        PostAsync<AuthResultDto>("/auth/verification/request", request);

    public Task<AuthResultDto> VerifyEmailAsync(AccountActionRequest request) =>
        PostAsync<AuthResultDto>("/auth/verify-email", request);

    public Task<AuthResultDto> ResetPasswordAsync(AccountActionRequest request) =>
        PostAsync<AuthResultDto>("/auth/password/reset", request);

    public Task<AuthSessionDto> ChangePasswordAsync(string currentPassword, string password) =>
        PostAsync<AuthSessionDto>("/auth/password/change", new ChangePasswordRequest(currentPassword, password));

    public Task<AuthResultDto> LinkGoogleAsync(string password, string redirectTo) =>
        PostAsync<AuthResultDto>("/auth/google/link", new LinkGoogleRequest(password, redirectTo));

    public Uri GetGoogleLoginUri(string redirectTo) => new UriBuilder(new Uri(api.BaseAddress, "auth/google/start"))
    {
        Query = $"redirectTo={Uri.EscapeDataString(redirectTo)}",
    }.Uri;
    private Task<T> PostAsync<T>(string path, object? request = null) =>
        api.ApiRequestAsync<T>(path, new ApiRequestOptions
        {
            Method = HttpMethod.Post,
            Body = request,
            IsBrowserCredentialRequired = true,
        });
}
