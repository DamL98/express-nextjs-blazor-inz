using FrontendBlazor.Client.Helpers;
using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Models;
using FrontendBlazor.Client.Models.DTOs;
using FrontendBlazor.Client.Services;
using Microsoft.AspNetCore.Components;

namespace FrontendBlazor.Client.Components.Reservations;

public partial class ReservationsList : IDisposable
{
    [Inject]
    private ReservationsService ReservationsApi { get; set; } = default!;

    private static readonly (ReservationGroup Key, string Label)[] Tabs =
    [
        (ReservationGroup.Upcoming, "Nadchodzące"),
        (ReservationGroup.History, "Historia"),
        (ReservationGroup.Cancelled, "Anulowane"),
        (ReservationGroup.All, "Wszystkie"),
    ];
    private readonly CancellationTokenSource _cancellation = new();
    private IReadOnlyList<ReservationDto> _reservations = [];
    private ReservationDto? _selectedReservation;
    private bool _busy;
    private string? _actionError;
    private string? _message;
    private ReservationGroup _activeTab = ReservationGroup.Upcoming;
    private string _search = string.Empty;
    private DateTimeOffset _currentTime = DateTimeOffset.Now;
    private PeriodicTimer? _timer;

    [Parameter, EditorRequired]
    public IReadOnlyList<ReservationDto> InitialReservations { get; set; } = [];

    private ReservationGroup GetGroup(ReservationDto reservation) =>
        ViewFilters.GetReservationGroup(reservation, _currentTime);

    private IEnumerable<ReservationDto> FilteredReservations => ViewFilters.FilterReservations(_reservations, _activeTab, _search, _currentTime);

    protected override void OnInitialized()
    {
        _reservations = InitialReservations;
        _timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        _ = TickAsync();
    }

    private async Task TickAsync()
    {
        try
        {
            while (await _timer!.WaitForNextTickAsync(_cancellation.Token))
            {
                await InvokeAsync(() =>
                {
                    _currentTime = DateTimeOffset.Now;
                    StateHasChanged();
                });
            }
        }
        catch (OperationCanceledException) when (_cancellation.IsCancellationRequested)
        {
            // Navigation disposed the component while its request was running.
        }
    }

    private void ShowAll()
    {
        _search = "";
        _activeTab = ReservationGroup.All;
    }

    private void SelectReservation(ReservationDto item)
    {
        _selectedReservation = item;
        _actionError = null;
    }

    private void CloseDialog()
    {
        if (!_busy)
        {
            _selectedReservation = null;
        }
    }

    private async Task HandleCancelAsync()
    {
        if (_busy || _selectedReservation is null)
        {
            return;
        }
        _busy = true;
        _actionError = _message = null;
        try
        {
            var result = await ReservationsApi.CancelReservationAsync(_selectedReservation.Id, _cancellation.Token);
            _reservations = _reservations.Select(r => r.Id == result.Id ? result : r).ToList();
            _selectedReservation = null;
            _message = "Rezerwacja anulowana. Znajdziesz ją w zakładce Anulowane.";
        }
        catch (OperationCanceledException) when (_cancellation.IsCancellationRequested)
        {
            // Navigation disposed the component while its request was running.
        }
        catch (Exception ex)
        {
            _actionError = ApiErrorMessage.FromException(ex, "Błąd anulowania rezerwacji");
        }
        finally
        {
            _busy = false;
        }
    }

    public void Dispose()
    {
        _cancellation.Cancel();
        _timer?.Dispose();
        _cancellation.Dispose();
    }
}
