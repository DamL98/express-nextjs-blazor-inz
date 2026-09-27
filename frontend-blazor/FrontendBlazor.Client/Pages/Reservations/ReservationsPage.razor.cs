using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Models.DTOs;
using FrontendBlazor.Client.Services;
using Microsoft.AspNetCore.Components;

namespace FrontendBlazor.Client.Pages.Reservations;

public partial class ReservationsPage : IDisposable
{
    [Inject]
    private ReservationsService ReservationsApi { get; set; } = default!;

    private readonly CancellationTokenSource _cancellation = new();
    private IReadOnlyList<ReservationDto> _reservations = [];
    private bool _loading = true;
    private string? _loadError;

    protected override async Task OnInitializedAsync()
    {
        try
        {
            _reservations = await ReservationsApi.GetMyReservationsAsync(_cancellation.Token);
        }
        catch (OperationCanceledException) when (_cancellation.IsCancellationRequested)
        {
            // TODO
        }
        catch (Exception ex)
        {
            _loadError = ApiErrorMessage.FromException(ex, "Błąd pobierania rezerwacji");
        }
        finally
        {
            _loading = false;
        }
    }

    public void Dispose()
    {
        _cancellation.Cancel();
        _cancellation.Dispose();
    }
}
