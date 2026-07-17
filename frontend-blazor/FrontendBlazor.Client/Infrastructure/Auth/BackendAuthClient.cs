using System.Net;
using FrontendBlazor.Client.Features.Auth;
using FrontendBlazor.Client.Infrastructure.Api;
using Microsoft.JSInterop;

namespace FrontendBlazor.Client.Infrastructure.Auth;

public sealed class BackendAuthClient(
    IJSRuntime jsRuntime,
    ApiClient apiClient) : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _module = new(
        () => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./js/backend-auth.js").AsTask());

    public async Task<LocalUser?> GetCurrentUserAsync()
    {
        var module = await _module.Value;
        var result = await module.InvokeAsync<BackendAuthResult<LocalUser>>(
            "getCurrentUser",
            apiClient.BaseAddress.ToString());

        if (result.Success)
        {
            return result.Data;
        }

        if (result.StatusCode == (int)HttpStatusCode.Unauthorized &&
            (result.ErrorCode is "AUTH_TOKEN_REQUIRED" or "AUTH_SESSION_INVALID" or "AUTH_TOKEN_INVALID"))
        {
            return null;
        }

        throw ToApiException(result);
    }

    public async Task RedirectToGoogleLoginAsync(string redirectTo)
    {
        var module = await _module.Value;
        await module.InvokeVoidAsync(
            "redirectToGoogleLogin",
            apiClient.BaseAddress.ToString(),
            redirectTo);
    }

    public async Task LogoutAsync()
    {
        var module = await _module.Value;
        var result = await module.InvokeAsync<BackendAuthResult<LogoutResult>>(
            "logout",
            apiClient.BaseAddress.ToString());

        if (!result.Success)
        {
            throw ToApiException(result);
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_module.IsValueCreated)
        {
            var module = await _module.Value;
            await module.DisposeAsync();
        }
    }

    private static ApiException ToApiException<T>(BackendAuthResult<T> result)
    {
        return new ApiException(
            result.ErrorCode ?? "API_INVALID_RESPONSE",
            result.ErrorMessage ?? "Blad API",
            result.StatusCode is null ? null : (HttpStatusCode)result.StatusCode.Value);
    }

    private sealed class BackendAuthResult<T>
    {
        public bool Success { get; init; }

        public int? StatusCode { get; init; }

        public T? Data { get; init; }

        public string? ErrorCode { get; init; }

        public string? ErrorMessage { get; init; }
    }

    private sealed class LogoutResult
    {
        public bool LoggedOut { get; init; }
    }
}
