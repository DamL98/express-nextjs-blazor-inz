namespace FrontendBlazor.Client.Features.Reservations.DTOs;

public sealed record CreateReservationRequestDto(
    string RoomId,
    string Title,
    string? Description,
    string StartTime,
    string EndTime);
