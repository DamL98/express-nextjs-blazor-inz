using System.Globalization;
using FrontendBlazor.Client.Features.Rooms.DTOs;
using FrontendBlazor.Client.Infrastructure.Api;

namespace FrontendBlazor.Client.Features.Rooms;

public sealed class RoomsApi(ApiClient apiClient)
{
    public async Task<IReadOnlyList<RoomDto>> GetRoomsAsync(
        CancellationToken cancellationToken = default)
    {
        return await apiClient.ApiRequestAsync<List<RoomDto>>(
            "/rooms",
            cancellationToken: cancellationToken);
    }

    public Task<RoomDto> GetRoomByIdAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        return apiClient.ApiRequestAsync<RoomDto>(
            $"/rooms/{Uri.EscapeDataString(id)}",
            cancellationToken: cancellationToken);
    }

    public Task<RoomAvailabilityDto> GetRoomAvailabilityAsync(
        string roomId,
        DateTime start,
        DateTime end,
        CancellationToken cancellationToken = default)
    {
        var startValue = Uri.EscapeDataString(
            start.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture));
        var endValue = Uri.EscapeDataString(
            end.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture));

        return apiClient.ApiRequestAsync<RoomAvailabilityDto>(
            $"/rooms/{Uri.EscapeDataString(roomId)}/availability" +
            $"?start={startValue}&end={endValue}",
            cancellationToken: cancellationToken);
    }
}
