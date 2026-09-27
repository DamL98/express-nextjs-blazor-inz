using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Models.DTOs;

namespace FrontendBlazor.Client.Services;

public sealed class GoogleCalendarService(ApiClient api)
{
    public Task<GoogleCalendarConnectionStatusDto> GetStatusAsync(CancellationToken cancellationToken = default) =>
        api.ApiRequestAsync<GoogleCalendarConnectionStatusDto>("/google-calendar/status", cancellationToken: cancellationToken);

    public Uri GetConnectionUri(string redirectTo) => new UriBuilder(new Uri(api.BaseAddress, "google-calendar/connect/start"))
    {
        Query = $"redirectTo={Uri.EscapeDataString(redirectTo)}",
    }.Uri;
}
