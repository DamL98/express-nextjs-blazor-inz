using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Models.DTOs;
using FrontendBlazor.Client.Services;
using Microsoft.AspNetCore.Components;

namespace FrontendBlazor.Client.Components.Rooms;

public partial class RoomDetails : IDisposable
{
    [Inject]
    private RoomsService RoomsApi { get; set; } = default!;

    [Inject]
    private NavigationManager Navigation { get; set; } = default!;

    [Parameter]
    public string Id { get; set; } = "";
    private CancellationTokenSource? _request;
    private RoomDto? _room;
    private string? _loadedId;
    private string? _error;
    private bool _loading = true;

    protected override async Task OnParametersSetAsync()
    {
        if (_loadedId == Id)
        {
            return;
        }
        _loadedId = Id;
        _request?.Cancel();
        _request?.Dispose();
        var request = _request = new CancellationTokenSource();
        _loading = true;
        _error = null;
        _room = null;
        try
        {
            var room = await RoomsApi.GetRoomAsync(Id, request.Token);
            if (!request.IsCancellationRequested)
            {
                _room = room;
            }
        }
        catch (OperationCanceledException) when (request.IsCancellationRequested)
        {
            // Navigation disposed the component while its request was running.
        }
        catch (Exception ex)
        {
            if (!request.IsCancellationRequested)
            {
                _error = ApiErrorMessage.FromException(ex, "Błąd pobierania danych sali");
            }
        }
        finally
        {
            if (!request.IsCancellationRequested)
            {
                _loading = false;
            }
        }
    }

    public void Dispose()
    {
        _request?.Cancel();
        _request?.Dispose();
    }
}
