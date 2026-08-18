using System.Text.Json.Serialization;

namespace FrontendBlazor.Client.Features.Rooms.DTOs;

public sealed record RoomAvailabilityDto(
    string RoomId,
    [property: JsonPropertyName("available")] bool IsAvailable,
    DateTimeOffset Start,
    DateTimeOffset End,
    List<RoomAvailabilityConflictDto> Conflicts);

public sealed record RoomAvailabilityConflictDto(
    string Id,
    string Title,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime);
