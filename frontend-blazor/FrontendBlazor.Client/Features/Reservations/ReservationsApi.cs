using FrontendBlazor.Client.Features.Reservations.DTOs;
using FrontendBlazor.Client.Infrastructure.Api;

namespace FrontendBlazor.Client.Features.Reservations;

public sealed class ReservationsApi(ApiClient apiClient)
{
    public Task<IReadOnlyList<ReservationDto>> GetMyReservationsAsync(
        ReservationFiltersDto? filters = null,
        CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(filters);
        return apiClient.ApiRequestAsync<IReadOnlyList<ReservationDto>>(
            $"/reservations/my{query}",
            cancellationToken: cancellationToken);
    }

    public Task<ReservationDto> CreateReservationAsync(
        CreateReservationRequestDto request,
        CancellationToken cancellationToken = default)
    {
        return apiClient.ApiRequestAsync<ReservationDto>(
            "/reservations",
            new ApiRequestOptions
            {
                Method = HttpMethod.Post,
                Body = request,
            },
            cancellationToken);
    }

    public Task<ReservationDto> CancelReservationAsync(
        string reservationId,
        CancellationToken cancellationToken = default)
    {
        return apiClient.ApiRequestAsync<ReservationDto>(
            $"/reservations/{Uri.EscapeDataString(reservationId)}/cancel",
            new ApiRequestOptions
            {
                Method = HttpMethod.Patch,
            },
            cancellationToken: cancellationToken);
    }

    private static string BuildQuery(ReservationFiltersDto? filters)
    {
        if (filters is null)
        {
            return string.Empty;
        }

        var parts = new List<string>();

        if (filters.Status is not null)
        {
            parts.Add($"status={Uri.EscapeDataString(filters.Status.Value.ToString())}");
        }

        if (!string.IsNullOrWhiteSpace(filters.RoomId))
        {
            parts.Add($"roomId={Uri.EscapeDataString(filters.RoomId)}");
        }

        return parts.Count == 0 ? string.Empty : $"?{string.Join("&", parts)}";
    }
}
