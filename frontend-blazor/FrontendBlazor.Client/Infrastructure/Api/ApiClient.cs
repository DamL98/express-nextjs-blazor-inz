using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Components.WebAssembly.Http;
using Microsoft.JSInterop;

namespace FrontendBlazor.Client.Infrastructure.Api;

public sealed class ApiClient(
    HttpClient httpClient,
    IJSRuntime jsRuntime) : IAsyncDisposable
{
    private const long MaxBrowserResponseSize = 10 * 1024 * 1024;

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
                options.Method,
                path,
                options.Token,
                options.Body,
                cancellationToken)
            : await SendWithHttpClientAsync(
                options.Method,
                path,
                options.Token,
                options.Body,
                cancellationToken);

        return ReadResponse<T>(response);
    }

    public async ValueTask DisposeAsync()
    {
        if (_browserApiModule.IsValueCreated)
        {
            var module = await _browserApiModule.Value;
            await module.DisposeAsync();
        }
    }

    private async Task<RawApiResponse> SendWithHttpClientAsync(
        HttpMethod method,
        string path,
        string? token,
        object? requestBody,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(
            method,
            path.TrimStart('/'));

        if (OperatingSystem.IsBrowser())
        {
            request.SetBrowserRequestCredentials(
                BrowserRequestCredentials.Include);
        }

        if (!string.IsNullOrWhiteSpace(token))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue(
                "Bearer",
                token);
        }

        if (requestBody is not null)
        {
            request.Content = new StringContent(
                JsonSerializer.Serialize(requestBody, SerializerOptions),
                Encoding.UTF8,
                "application/json");
        }

        try
        {
            using var response = await httpClient.SendAsync(
                request,
                cancellationToken);
            var body = await response.Content.ReadAsStringAsync(
                cancellationToken);

            return new RawApiResponse(
                response.StatusCode,
                response.Content.Headers.ContentType?.MediaType,
                body);
        }
        catch (HttpRequestException exception)
        {
            throw CreateConnectionException(exception);
        }
        catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            throw CreateTimeoutException(exception);
        }
    }

    private async Task<RawApiResponse> SendWithBrowserAsync(
        HttpMethod method,
        string path,
        string? token,
        object? requestBody,
        CancellationToken cancellationToken)
    {
        try
        {
            var module = await _browserApiModule.Value;
            var body = requestBody is null
                ? null
                : JsonSerializer.Serialize(requestBody, SerializerOptions);
            var response = await module.InvokeAsync<BrowserApiResponse>(
                "startApiRequest",
                cancellationToken,
                BaseAddress.ToString(),
                path,
                method.Method,
                token,
                body);

            try
            {
                await using var bodyReference =
                    await module.InvokeAsync<IJSStreamReference>(
                        "getApiResponseBody",
                        cancellationToken,
                        response.ResponseId);
                await using var bodyStream =
                    await bodyReference.OpenReadStreamAsync(
                        MaxBrowserResponseSize,
                        cancellationToken);
                using var reader = new StreamReader(
                    bodyStream,
                    Encoding.UTF8);
                var responseBody = await reader.ReadToEndAsync(
                    cancellationToken);

                return new RawApiResponse(
                    (HttpStatusCode)response.StatusCode,
                    response.ContentType,
                    responseBody);
            }
            finally
            {
                await module.InvokeVoidAsync(
                    "releaseApiResponse",
                    response.ResponseId);
            }
        }
        catch (JSException exception)
        {
            throw CreateConnectionException(exception);
        }
        catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            throw CreateTimeoutException(exception);
        }
    }

    private static T ReadResponse<T>(RawApiResponse response)
    {
        var statusCode = (int)response.StatusCode;

        if (statusCode is < 200 or >= 300)
        {
            throw CreateApiException(response);
        }

        var body = DeserializeSuccess<T>(response.Body, response.StatusCode);

        if (!body.IsSuccess)
        {
            throw CreateInvalidResponseException(response.StatusCode);
        }

        return body.Data ?? throw new ApiException(
            "API_DATA_MISSING",
            "Brak danych od API",
            response.StatusCode);
    }

    private static ApiResponse<T> DeserializeSuccess<T>(
        string json,
        HttpStatusCode statusCode)
    {
        try
        {
            return JsonSerializer.Deserialize<ApiResponse<T>>(
                json,
                SerializerOptions)
                ?? throw CreateInvalidResponseException(statusCode);
        }
        catch (JsonException exception)
        {
            throw CreateInvalidResponseException(statusCode, exception);
        }
    }

    private static ApiException CreateApiException(RawApiResponse response)
    {
        if (response.ContentType?.StartsWith(
            "application/problem+json",
            StringComparison.OrdinalIgnoreCase) != true)
        {
            return CreateInvalidResponseException(response.StatusCode);
        }

        ProblemDetailsDto problem;

        try
        {
            problem = JsonSerializer.Deserialize<ProblemDetailsDto>(
                response.Body,
                SerializerOptions)
                ?? throw CreateInvalidResponseException(response.StatusCode);
        }
        catch (JsonException exception)
        {
            return CreateInvalidResponseException(response.StatusCode, exception);
        }

        if (problem.Status != (int)response.StatusCode ||
            string.IsNullOrWhiteSpace(problem.Type) ||
            string.IsNullOrWhiteSpace(problem.Title))
        {
            return CreateInvalidResponseException(response.StatusCode);
        }

        var code = string.IsNullOrWhiteSpace(problem.Code)
            ? problem.Type
            : problem.Code;
        var message = string.IsNullOrWhiteSpace(problem.Detail)
            ? problem.Title
            : problem.Detail;
        var details = problem.Errors ?? problem.Details;

        return new ApiException(
            code,
            message,
            response.StatusCode,
            details,
            problem.Type,
            problem.Instance);
    }

    private static ApiException CreateConnectionException(Exception exception)
    {
        return new ApiException(
            "API_CONNECTION_ERROR",
            "Blad laczenia z API",
            innerException: exception);
    }

    private static ApiException CreateTimeoutException(Exception exception)
    {
        return new ApiException(
            "API_TIMEOUT",
            "Przekroczono czas oczekiwania API response",
            innerException: exception);
    }

    private static ApiException CreateInvalidResponseException(
        HttpStatusCode statusCode,
        Exception? innerException = null)
    {
        var statusCodeValue = (int)statusCode;
        var message = statusCodeValue is >= 200 and < 300
            ? "Nieprawidlowy format danych od API"
            : $"Blad API status: {statusCodeValue}";

        return new ApiException(
            "API_INVALID_RESPONSE",
            message,
            statusCode,
            innerException: innerException);
    }

    private sealed record RawApiResponse(
        HttpStatusCode StatusCode,
        string? ContentType,
        string Body);

    private sealed class BrowserApiResponse
    {
        public string ResponseId { get; init; } = string.Empty;

        public int StatusCode { get; init; }

        public string? ContentType { get; init; }

        public int BodyLength { get; init; }
    }
}
