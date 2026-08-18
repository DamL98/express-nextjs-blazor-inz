using FrontendBlazor.Client.Features.GoogleCalendar.DTOs;
using FrontendBlazor.Client.Infrastructure.Api;

namespace FrontendBlazor.Client.Features.GoogleCalendar;

public sealed class GoogleCalendarApi(ApiClient apiClient)
{
    public Task<GoogleCalendarConnectionStatusDto> GetStatusAsync(
        CancellationToken cancellationToken = default)
    {
        return apiClient.ApiRequestAsync<GoogleCalendarConnectionStatusDto>(
            "/google-calendar/status",
            new ApiRequestOptions
            {
                IsBrowserCredentialRequired = true,
            },
            cancellationToken: cancellationToken);
    }

    public string BuildConnectionUrl(string redirectTo)
    {
        var url = new Uri(apiClient.BaseAddress, "google-calendar/connect/start");
        var builder = new UriBuilder(url);
        builder.Query = $"redirectTo={Uri.EscapeDataString(redirectTo)}";

        return builder.Uri.ToString();
    }

}
