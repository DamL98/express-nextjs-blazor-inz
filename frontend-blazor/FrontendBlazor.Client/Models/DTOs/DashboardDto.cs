namespace FrontendBlazor.Client.Models.DTOs;

public sealed record DashboardDto(
    int ActiveRoomsCount,
    IReadOnlyList<ReservationDto> NextReservations);
