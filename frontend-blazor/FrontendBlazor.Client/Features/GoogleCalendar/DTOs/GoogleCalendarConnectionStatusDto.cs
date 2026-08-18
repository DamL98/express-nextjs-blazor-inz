using System.Text.Json.Serialization;

namespace FrontendBlazor.Client.Features.GoogleCalendar.DTOs;

public sealed record GoogleCalendarConnectionStatusDto(
    [property: JsonPropertyName("connected")] bool IsConnected,
    string? Provider,
    string? CalendarEmail,
    DateTimeOffset? ConnectedAt,
    DateTimeOffset? TokenExpiresAt,
    [property: JsonPropertyName("syncEnabled")] bool IsSyncEnabled);
