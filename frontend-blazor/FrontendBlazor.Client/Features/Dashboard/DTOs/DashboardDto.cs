using FrontendBlazor.Client.Features.Reservations.DTOs;

namespace FrontendBlazor.Client.Features.Dashboard.DTOs;

public sealed record DashboardDto(
    int ActiveRoomsCount,
    IReadOnlyList<ReservationDto> NextReservations);
