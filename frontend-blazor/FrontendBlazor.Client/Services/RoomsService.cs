using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Models.DTOs;

namespace FrontendBlazor.Client.Services;

public sealed class RoomsService(ApiClient api)
{
    public Task<IReadOnlyList<RoomDto>> GetRoomsAsync(CancellationToken cancellationToken = default) =>
        api.ApiRequestAsync<IReadOnlyList<RoomDto>>("/rooms", cancellationToken: cancellationToken);

    public Task<RoomDto> GetRoomAsync(string id, CancellationToken cancellationToken = default) =>
        api.ApiRequestAsync<RoomDto>($"/rooms/{Uri.EscapeDataString(id)}", cancellationToken: cancellationToken);

    public Task<RoomAvailabilityDto> GetRoomAvailabilityAsync(
        string roomId,
        string startTime,
        string endTime,
        CancellationToken cancellationToken = default) =>
        api.ApiRequestAsync<RoomAvailabilityDto>(
            $"/rooms/{Uri.EscapeDataString(roomId)}/availability" +
            $"?start={Uri.EscapeDataString(startTime)}&end={Uri.EscapeDataString(endTime)}",
            cancellationToken: cancellationToken);
}
