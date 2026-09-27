using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Models.DTOs;
using FrontendBlazor.Client.Services;
using Microsoft.AspNetCore.Components;

namespace FrontendBlazor.Client.Pages;

public partial class DashboardPage : IDisposable
{
    [Inject]
    private DashboardService Dashboard { get; set; } = default!;

    private readonly CancellationTokenSource _requestCancellation = new();
    private IReadOnlyList<ReservationDto> _nextReservations = [];
    private bool _isLoading = true;
    private string? _errorMessage;
    private int _activeRoomsCount;

    protected override async Task OnAfterRenderAsync(bool isFirstRender)
    {
        if (!isFirstRender || !RendererInfo.IsInteractive)
        {
            return;
        }
        try
        {
            var dashboard = await Dashboard.GetDashboardAsync(_requestCancellation.Token);
            _activeRoomsCount = dashboard.ActiveRoomsCount;
            _nextReservations = dashboard.NextReservations;
        }
        catch (OperationCanceledException) when (_requestCancellation.IsCancellationRequested)
        {
        }
        catch (Exception exception)
        {
            _errorMessage = ApiErrorMessage.FromException(
                exception,
                "Blad pobierania danych do dashboard");
        }
        finally
        {
            _isLoading = false;
        }
        if (!_requestCancellation.IsCancellationRequested)
        {
            StateHasChanged();
        }
    }

    public void Dispose()
    {
        _requestCancellation.Cancel();
        _requestCancellation.Dispose();
    }
}
