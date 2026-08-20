namespace FrontendBlazor.Client.Models.DTOs;

public sealed record RoomAvailabilityConflictDto(
    string Id,
    string Title,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime);
