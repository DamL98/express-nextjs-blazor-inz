using System.Globalization;
using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Models.DTOs;
using FrontendBlazor.Client.Services;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;

namespace FrontendBlazor.Client.Components.Reservations;

public partial class ReservationCalendar : IDisposable
{
    [Inject]
    private RoomsService RoomsApi { get; set; } = default!;

    [Inject]
    private ReservationsService ReservationsApi { get; set; } = default!;

    private static readonly CultureInfo Polish = CultureInfo.GetCultureInfo("pl-PL");
    private static readonly string[] Weekdays = ["pon.", "wt.", "śr.", "czw.", "pt.", "sob.", "niedz."];
    private readonly CancellationTokenSource _cancellation = new();
    private IReadOnlyList<ReservationDto> _reservations = [];
    private IReadOnlyList<RoomDto> _rooms = [];
    private DateTime _selectedDay = DateTime.Today;
    private DateTime _month = DateTime.Today;
    private DateTime? _updatedAt;
    private DateTime? _focusDay;
    private bool _loading = true;
    private bool _roomsUnavailable;
    private string? _error;

    protected override Task OnInitializedAsync() => RefreshCalendarAsync();

    private async Task RefreshCalendarAsync()
    {
        _loading = true;
        _error = null;
        var roomsTask = LoadRoomsAsync();
        try
        {
            _reservations = await ReservationsApi.GetMyReservationsAsync(_cancellation.Token);
            _updatedAt = DateTime.Now;
        }
        catch (OperationCanceledException) when (_cancellation.IsCancellationRequested)
        {
            // Navigation disposed the component while its request was running.
        }
        catch (Exception ex)
        {
            _error = ApiErrorMessage.FromException(ex, "Nie udało się pobrać kalendarza rezerwacji.");
        }
        await roomsTask;
        _loading = false;
    }

    private async Task LoadRoomsAsync()
    {
        try
        {
            _rooms = await RoomsApi.GetRoomsAsync(_cancellation.Token);
            _roomsUnavailable = false;
        }
        catch (OperationCanceledException) when (_cancellation.IsCancellationRequested)
        {
            // Navigation disposed the component while its request was running.
        }
        catch
        {
            _rooms = [];
            _roomsUnavailable = true;
        }
    }

    private void ShowToday()
    {
        _selectedDay = _month = DateTime.Today;
    }

    private void MoveMonth(int offset)
    {
        _month = _month.AddMonths(offset);
    }

    private void DayKey(KeyboardEventArgs e, DateTime day)
    {
        DateTime? next = e.Key switch
        {
            "ArrowLeft" => day.AddDays(-1),
            "ArrowRight" => day.AddDays(1),
            "ArrowUp" => day.AddDays(-7),
            "ArrowDown" => day.AddDays(7),
            "Home" => day.AddDays(-(((int)day.DayOfWeek + 6) % 7)),
            "End" => day.AddDays(6 - (((int)day.DayOfWeek + 6) % 7)),
            "PageUp" => day.AddMonths(-1),
            "PageDown" => day.AddMonths(1),
            _ => null
        };
        if (next is null)
        {
            return;
        }
        _selectedDay = _month = next.Value;
        _focusDay = next;
    }

    public void Dispose()
    {
        _cancellation.Cancel();
        _cancellation.Dispose();
    }
}
