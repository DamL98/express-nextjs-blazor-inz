using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Models.DTOs;
using FrontendBlazor.Client.Services;
using Microsoft.AspNetCore.Components;

namespace FrontendBlazor.Client.Pages.Rooms;

public partial class RoomsPage : IDisposable
{
    [Inject]
    private RoomsService RoomsApi { get; set; } = default!;

    private readonly CancellationTokenSource _cancellation = new();
    private IReadOnlyList<RoomDto> _rooms = [];
    private bool _loading = true;
    private string? _error;

    protected override async Task OnInitializedAsync()
    {
        try
        {
            _rooms = await RoomsApi.GetRoomsAsync(_cancellation.Token);
        }
        catch (OperationCanceledException) when (_cancellation.IsCancellationRequested)
        {
            // Navigation disposed the component while its request was running.
        }
        catch (Exception ex)
        {
            _error = ApiErrorMessage.FromException(ex, "Błąd pobierania listy sal");
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
