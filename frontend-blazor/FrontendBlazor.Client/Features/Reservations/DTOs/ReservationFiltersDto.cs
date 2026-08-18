using FrontendBlazor.Client.Features.Reservations;

namespace FrontendBlazor.Client.Features.Reservations.DTOs;

public sealed class ReservationFiltersDto
{
    public ReservationStatus? Status { get; init; }

    public string? RoomId { get; init; }
}
