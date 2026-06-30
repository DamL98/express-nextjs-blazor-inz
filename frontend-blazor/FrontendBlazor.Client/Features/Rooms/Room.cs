namespace FrontendBlazor.Client.Features.Rooms;

public sealed record Room(
    string Id,
    string Name,
    string Location,
    string? Description,
    int Capacity,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
