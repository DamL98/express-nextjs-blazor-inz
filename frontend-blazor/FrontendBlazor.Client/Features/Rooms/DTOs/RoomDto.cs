namespace FrontendBlazor.Client.Features.Rooms.DTOs;

public sealed record RoomDto(
    string Id,
    string Name,
    string Location,
    string? Description,
    int Capacity,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
