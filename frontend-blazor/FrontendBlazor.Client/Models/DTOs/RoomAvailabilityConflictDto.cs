namespace FrontendBlazor.Client.Models.DTOs;

public sealed record RoomAvailabilityConflictDto(
    DateTimeOffset StartTime,
    DateTimeOffset EndTime);
