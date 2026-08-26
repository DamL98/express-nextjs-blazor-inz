using System.Text.Json.Serialization;

namespace FrontendBlazor.Client.Models.DTOs;

public sealed record GoogleCalendarConnectionStatusDto(
    [property: JsonPropertyName("connected")] bool IsConnected,
    string? Provider,
    string? CalendarEmail,
    DateTimeOffset? ConnectedAt,
    DateTimeOffset? TokenExpiresAt,
    [property: JsonPropertyName("syncEnabled")] bool IsSyncEnabled);
