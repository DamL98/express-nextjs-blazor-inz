namespace FrontendBlazor.Client.Infrastructure.Api;

public static class ApiErrorMessage
{
    public static string FromException(
        Exception exception,
        string fallbackMessage)
    {
        if (exception is ApiException &&
            !string.IsNullOrWhiteSpace(exception.Message))
        {
            return exception.Message;
        }

        return fallbackMessage;
    }
}
