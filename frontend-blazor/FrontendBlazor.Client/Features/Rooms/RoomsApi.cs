using System.Globalization;
using FrontendBlazor.Client.Infrastructure.Api;

namespace FrontendBlazor.Client.Features.Rooms;

public sealed class RoomsApi(ApiClient apiClient)
{
    public async Task<IReadOnlyList<Room>> GetRoomsAsync(
        CancellationToken cancellationToken = default)
    {
        return await apiClient.ApiRequestAsync<List<Room>>(
            "/rooms",
            cancellationToken: cancellationToken);
    }

    public Task<Room> GetRoomByIdAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        return apiClient.ApiRequestAsync<Room>(
            $"/rooms/{Uri.EscapeDataString(id)}",
            cancellationToken: cancellationToken);
    }

    public Task<RoomAvailability> GetRoomAvailabilityAsync(
        string roomId,
        DateTime start,
        DateTime end,
        CancellationToken cancellationToken = default)
    {
        var startValue = Uri.EscapeDataString(
            start.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture));
        var endValue = Uri.EscapeDataString(
            end.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture));

        return apiClient.ApiRequestAsync<RoomAvailability>(
            $"/rooms/{Uri.EscapeDataString(roomId)}/availability" +
            $"?start={startValue}&end={endValue}",
            cancellationToken: cancellationToken);
    }
}
