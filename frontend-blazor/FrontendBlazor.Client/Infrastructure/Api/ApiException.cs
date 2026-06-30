using System.Net;
using System.Text.Json;

namespace FrontendBlazor.Client.Infrastructure.Api;

public sealed class ApiException : Exception
{
    public ApiException(
        string code,
        string message,
        HttpStatusCode? statusCode = null,
        JsonElement? details = null,
        Exception? innerException = null)
        : base(message, innerException)
    {
        Code = code;
        StatusCode = statusCode;
        Details = details;
    }

    public string Code { get; }

    public HttpStatusCode? StatusCode { get; }

    public JsonElement? Details { get; }
}
