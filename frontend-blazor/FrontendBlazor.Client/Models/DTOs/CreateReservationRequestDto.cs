namespace FrontendBlazor.Client.Models.DTOs;

public sealed record CreateReservationRequestDto(
    string RoomId,
    string Title,
    string? Description,
    string StartTime,
    string EndTime);
