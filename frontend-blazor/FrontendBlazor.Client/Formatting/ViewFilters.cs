using System.Globalization;
using FrontendBlazor.Client.Models;
using FrontendBlazor.Client.Models.DTOs;

namespace FrontendBlazor.Client.Formatting;

public static class ViewFilters
{
    private static readonly CultureInfo Polish = CultureInfo.GetCultureInfo("pl-PL");

    public static IEnumerable<RoomDto> Rooms(IEnumerable<RoomDto> rooms, string? search, string? capacity, string? active, string? sort)
    {
        double.TryParse(capacity, NumberStyles.Float, CultureInfo.InvariantCulture, out var minimum);
        var result = rooms.Where(room =>
            Polish.CompareInfo.IndexOf($"{room.Name} {room.Location}", search?.Trim() ?? "", CompareOptions.IgnoreCase) >= 0 &&
            (!double.IsFinite(minimum) || minimum <= 0 || room.Capacity >= minimum) &&
            (active is not ("true" or "false") || room.IsActive == (active == "true")));
        return sort switch
        {
            "capacity-asc" => result.OrderBy(room => room.Capacity),
            "capacity-desc" => result.OrderByDescending(room => room.Capacity),
            _ => result.OrderBy(room => room.Name, StringComparer.Create(Polish, false))
        };
    }

    public static string Group(ReservationDto reservation, DateTimeOffset now) =>
        reservation.Status == ReservationStatus.CANCELLED ? "cancelled" : reservation.EndTime <= now ? "history" : "upcoming";

    public static IEnumerable<ReservationDto> DayReservations(IEnumerable<ReservationDto> reservations, DateTime day)
    {
        // Each boundary is converted separately to retain the correct offset on DST transition days.
        var start = new DateTimeOffset(DateTime.SpecifyKind(day.Date, DateTimeKind.Local));
        var end = new DateTimeOffset(DateTime.SpecifyKind(day.Date.AddDays(1), DateTimeKind.Local));
        return reservations.Where(item => item.Status == ReservationStatus.ACTIVE &&
            item.StartTime < item.EndTime && item.StartTime < end && item.EndTime > start)
            .OrderBy(item => item.StartTime);
    }
}
