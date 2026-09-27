using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Models.DTOs;

namespace FrontendBlazor.Client.Services;

public sealed class ReservationsService(ApiClient api)
{
    public Task<IReadOnlyList<ReservationDto>> GetMyReservationsAsync(CancellationToken cancellationToken = default) =>
        api.ApiRequestAsync<IReadOnlyList<ReservationDto>>("/reservations/my", cancellationToken: cancellationToken);

    public Task<ReservationDto> CreateReservationAsync(
        CreateReservationRequestDto request,
        CancellationToken cancellationToken = default) =>
        api.ApiRequestAsync<ReservationDto>("/reservations", new ApiRequestOptions
        {
            Method = HttpMethod.Post,
            Body = request,
        }, cancellationToken);

    public Task<ReservationDto> CancelReservationAsync(string id, CancellationToken cancellationToken = default) =>
        api.ApiRequestAsync<ReservationDto>($"/reservations/{Uri.EscapeDataString(id)}/cancel", new ApiRequestOptions
        {
            Method = HttpMethod.Patch,
        }, cancellationToken);
}
