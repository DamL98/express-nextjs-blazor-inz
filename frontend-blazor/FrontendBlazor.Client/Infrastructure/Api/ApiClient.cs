using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Components.WebAssembly.Http;
using Microsoft.JSInterop;

namespace FrontendBlazor.Client.Infrastructure.Api;

public sealed class ApiClient(
    HttpClient httpClient,
    IJSRuntime jsRuntime) : IAsyncDisposable
{
    private static readonly JsonSerializerOptions SerializerOptions =
        new(JsonSerializerDefaults.Web);

    private readonly Lazy<Task<IJSObjectReference>> _browserApiModule = new(
        () => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./js/backend-api.js").AsTask());

    public Uri BaseAddress => httpClient.BaseAddress
        ?? throw new InvalidOperationException("Brak BaseAddress dla API");

    public async Task<T> ApiRequestAsync<T>(
        string path,
        ApiRequestOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        options ??= new ApiRequestOptions();

        var response = options.IsBrowserCredentialRequired &&
            !OperatingSystem.IsBrowser()
            ? await SendWithBrowserAsync(
                path,
                options,
                cancellationToken)
            : await SendWithHttpClientAsync(
                path,
                options,
                cancellationToken);

        if (response.StatusCode is < 200 or >= 300)
        {
            var problem = JsonSerializer.Deserialize<ProblemDetailsDto>(
                response.Body,
                SerializerOptions);

            throw new ApiException(
                problem?.Code ?? problem?.Type ?? $"HTTP_{response.StatusCode}",
                problem?.Detail ?? problem?.Title ?? $"Blad API status: {response.StatusCode}",
                (HttpStatusCode)response.StatusCode,
                problem?.Errors ?? problem?.Details,
                problem?.Type,
                problem?.Instance);
        }

        var result = JsonSerializer.Deserialize<ApiResponse<T>>(
            response.Body,
            SerializerOptions);

        return result is { IsSuccess: true, Data: not null }
            ? result.Data
            : throw new InvalidOperationException("Nieprawidlowa odpowiedz API");
    }

    private async Task<BrowserApiResponse> SendWithHttpClientAsync(
        string path,
        ApiRequestOptions options,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(
            options.Method,
            path.TrimStart('/'));

        if (OperatingSystem.IsBrowser())
        {
            request.SetBrowserRequestCredentials(BrowserRequestCredentials.Include);
        }

        if (options.Body is not null)
        {
            request.Content = new StringContent(
                JsonSerializer.Serialize(options.Body, SerializerOptions),
                Encoding.UTF8,
                "application/json");
        }

        using var response = await httpClient.SendAsync(request, cancellationToken);

        return new BrowserApiResponse
        {
            StatusCode = (int)response.StatusCode,
            Body = await response.Content.ReadAsStringAsync(cancellationToken),
        };
    }

    private async Task<BrowserApiResponse> SendWithBrowserAsync(
        string path,
        ApiRequestOptions options,
        CancellationToken cancellationToken)
    {
        var module = await _browserApiModule.Value;
        var requestId = Guid.NewGuid().ToString("N");
        var body = options.Body is null
            ? null
            : JsonSerializer.Serialize(options.Body, SerializerOptions);

        try
        {
            return await module.InvokeAsync<BrowserApiResponse>(
                "sendApiRequest",
                cancellationToken,
                requestId,
                BaseAddress.ToString(),
                path,
                options.Method.Method,
                body);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            await module.InvokeVoidAsync("cancelApiRequest", requestId);
            throw;
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_browserApiModule.IsValueCreated)
        {
            var module = await _browserApiModule.Value;
            await module.DisposeAsync();
        }
    }

    private sealed class BrowserApiResponse
    {
        public int StatusCode { get; init; }

        public string Body { get; init; } = string.Empty;
    }
}
