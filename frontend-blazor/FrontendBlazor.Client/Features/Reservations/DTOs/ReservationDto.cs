using FrontendBlazor.Client.Features.Reservations;

namespace FrontendBlazor.Client.Features.Reservations.DTOs;

public sealed record ReservationDto(
    string Id,
    string UserId,
    string RoomId,
    string Title,
    string? Description,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    ReservationStatus Status,
    string? GoogleCalendarEventId,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    ReservationRoomDto? Room);
