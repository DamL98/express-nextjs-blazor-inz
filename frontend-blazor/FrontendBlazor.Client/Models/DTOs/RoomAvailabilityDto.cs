using System.Text.Json.Serialization;

namespace FrontendBlazor.Client.Models.DTOs;

public sealed record RoomAvailabilityDto(
    string RoomId,
    [property: JsonPropertyName("available")] bool IsAvailable,
    DateTimeOffset Start,
    DateTimeOffset End,
    List<RoomAvailabilityConflictDto> Conflicts);
