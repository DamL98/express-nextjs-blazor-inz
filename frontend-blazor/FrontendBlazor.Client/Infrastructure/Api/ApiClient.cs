using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace FrontendBlazor.Client.Infrastructure.Api;

public sealed class ApiClient(HttpClient httpClient)
{
    private static readonly JsonSerializerOptions SerializerOptions =
        new(JsonSerializerDefaults.Web);

    public Uri BaseAddress => httpClient.BaseAddress
        ?? throw new InvalidOperationException("Brak BaseAddress dla API");

    public async Task<T> ApiRequestAsync<T>(
        string path,
        ApiRequestOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        options ??= new ApiRequestOptions();

        return await SendAsync<T>(
            options.Method,
            path,
            options.Token,
            options.Body,
            cancellationToken: cancellationToken);
    }

    private async Task<T> SendAsync<T>(
        HttpMethod method,
        string path,
        string? token = null,
        object? requestBody = null,
        CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(
            method,
            path.TrimStart('/'));

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

        HttpResponseMessage response;

        try
        {
            response = await httpClient.SendAsync(request, cancellationToken);
        }
        catch (HttpRequestException exception)
        {
            throw new ApiException(
                "API_CONNECTION_ERROR",
                "Błąd łączenia z API",
                innerException: exception);
        }
        catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            throw new ApiException(
                "API_TIMEOUT",
                "Przekroczono czas oczekiwania API response",
                innerException: exception);
        }

        using (response)
        {
            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            var body = Deserialize<T>(json, response);

            if (!response.IsSuccessStatusCode || !body.Success)
            {
                var statusCode = (int)response.StatusCode;
                var code = string.IsNullOrWhiteSpace(body.Error?.Code)
                    ? $"HTTP_{statusCode}"
                    : body.Error.Code;
                var message = string.IsNullOrWhiteSpace(body.Error?.Message)
                    ? "Błąd API"
                    : body.Error.Message;

                throw new ApiException(
                    code,
                    message,
                    response.StatusCode,
                    body.Error?.Details);
            }

            return body.Data ?? throw new ApiException(
                "API_DATA_MISSING",
                "Brak danych od API",
                response.StatusCode);
        }
    }

    private static ApiResponse<T> Deserialize<T>(
        string json,
        HttpResponseMessage response)
    {
        try
        {
            return JsonSerializer.Deserialize<ApiResponse<T>>(
                json,
                SerializerOptions) ?? throw InvalidResponse(response);
        }
        catch (JsonException exception)
        {
            throw InvalidResponse(response, exception);
        }
    }

    private static ApiException InvalidResponse(
        HttpResponseMessage response,
        Exception? innerException = null)
    {
        var statusCode = (int)response.StatusCode;
        var message = response.IsSuccessStatusCode
            ? "Nieprawidłowy format danych od API"
            : $"Błąd API status: {statusCode}";

        return new ApiException(
            "API_INVALID_RESPONSE",
            message,
            response.StatusCode,
            innerException: innerException);
    }
}
