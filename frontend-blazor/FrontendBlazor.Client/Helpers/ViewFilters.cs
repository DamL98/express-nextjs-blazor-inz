using System.Globalization;
using FrontendBlazor.Client.Models;
using FrontendBlazor.Client.Models.DTOs;

namespace FrontendBlazor.Client.Helpers;

public static class ViewFilters
{
    private static readonly CultureInfo Polish = CultureInfo.GetCultureInfo("pl-PL");

    public static IEnumerable<RoomDto> FilterRooms(IEnumerable<RoomDto> rooms, RoomFilters filters)
    {
        double.TryParse(filters.Capacity, NumberStyles.Float, CultureInfo.InvariantCulture, out var minimum);
        var result = rooms.Where(room =>
            Polish.CompareInfo.IndexOf($"{room.Name} {room.Location}", filters.Search?.Trim() ?? "", CompareOptions.IgnoreCase) >= 0 &&
            (!double.IsFinite(minimum) || minimum <= 0 || room.Capacity >= minimum) &&
            (filters.Active is not ("true" or "false") || room.IsActive == (filters.Active == "true")));
        return filters.Sort switch
        {
            "capacity-asc" => result.OrderBy(room => room.Capacity),
            "capacity-desc" => result.OrderByDescending(room => room.Capacity),
            _ => result.OrderBy(room => room.Name, StringComparer.Create(Polish, false))
        };
    }

    public static ReservationGroup GetReservationGroup(ReservationDto reservation, DateTimeOffset now) =>
        reservation.Status == ReservationStatus.Cancelled
            ? ReservationGroup.Cancelled
            : reservation.EndTime <= now ? ReservationGroup.History : ReservationGroup.Upcoming;

    public static IEnumerable<ReservationDto> FilterReservations(
        IEnumerable<ReservationDto> reservations,
        ReservationGroup view,
        string search,
        DateTimeOffset now)
    {
        var query = search.Trim();
        var filtered = reservations.Where(reservation =>
            (view == ReservationGroup.All || GetReservationGroup(reservation, now) == view) &&
            Polish.CompareInfo.IndexOf($"{reservation.Title} {reservation.Room?.Name}", query, CompareOptions.IgnoreCase) >= 0);
        return view == ReservationGroup.Upcoming
            ? filtered.OrderBy(reservation => reservation.StartTime)
            : filtered.OrderByDescending(reservation => reservation.StartTime);
    }

}
