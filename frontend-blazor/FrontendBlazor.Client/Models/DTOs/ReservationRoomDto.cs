namespace FrontendBlazor.Client.Models.DTOs;

public sealed record ReservationRoomDto(
    string Id,
    string Name,
    string Location,
    string? Description,
    int Capacity,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
