namespace FrontendBlazor.Client.Features.Rooms;

public sealed record RoomAvailability(
    string RoomId,
    bool Available,
    DateTimeOffset Start,
    DateTimeOffset End,
    List<RoomAvailabilityConflict> Conflicts);

public sealed record RoomAvailabilityConflict(
    string Id,
    string Title,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime);
