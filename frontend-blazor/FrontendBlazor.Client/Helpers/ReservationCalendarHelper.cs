using FrontendBlazor.Client.Models;
using FrontendBlazor.Client.Models.DTOs;

namespace FrontendBlazor.Client.Helpers;

public static class ReservationCalendarHelper
{
    public static IEnumerable<ReservationDto> GetDayReservations(IEnumerable<ReservationDto> reservations, DateTime day)
    {
        // Each boundary is converted separately to retain the correct offset on DST transition days.
        var start = new DateTimeOffset(DateTime.SpecifyKind(day.Date, DateTimeKind.Local));
        var end = new DateTimeOffset(DateTime.SpecifyKind(day.Date.AddDays(1), DateTimeKind.Local));
        return reservations.Where(item => item.Status == ReservationStatus.Active &&
            item.StartTime < item.EndTime && item.StartTime < end && item.EndTime > start)
            .OrderBy(item => item.StartTime);
    }
}
