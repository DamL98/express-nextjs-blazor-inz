using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Models.DTOs;
using FrontendBlazor.Client.Models.Forms;
using FrontendBlazor.Client.Services;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace FrontendBlazor.Client.Components.Reservations;

public partial class ReservationForm : IAsyncDisposable
{
    private static readonly (int Minutes, string Label)[] DurationOptions =
    [
        (30, "30 min"),
        (60, "1 godz."),
        (120, "2 godz."),
    ];

    [Inject]
    private RoomsService RoomsApi { get; set; } = default!;

    [Inject]
    private ReservationsService ReservationsApi { get; set; } = default!;

    [Inject]
    private IJSRuntime JS { get; set; } = default!;

    [Parameter, EditorRequired]
    public string RoomId { get; set; } = string.Empty;

    [Parameter, EditorRequired]
    public string RoomName { get; set; } = string.Empty;
    private readonly CancellationTokenSource _cancellation = new();
    private ReservationFormState _form = new();
    private string _zone = "lokalna";
    private string? _error;
    private bool _busy;
    private ReservationDto? _submitted;
    private IJSObjectReference? _module;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            _module = await JS.InvokeAsync<IJSObjectReference>("import", "./js/ui.js");
            _zone = await _module.InvokeAsync<string>("timeZone");
            StateHasChanged();
        }
    }

    private async Task NewReservationAsync()
    {
        _submitted = null;
        if (_module is not null)
        {
            await _module.InvokeVoidAsync("focusField", "startTime");
        }
    }

    private async Task HandleSubmitAsync()
    {
        if (_busy)
        {
            return;
        }
        _error = null;
        _submitted = null;
        var validationError = _form.ValidateForm();
        if (validationError is not null)
        {
            _error = validationError.Message;
            if (_module is not null)
            {
                await _module.InvokeVoidAsync("focusField", validationError.FieldId);
            }
            return;
        }
        _busy = true;
        try
        {
            var request = _form.ToRequest(RoomId);
            var availability = await RoomsApi.GetRoomAvailabilityAsync(RoomId, request.StartTime, request.EndTime, _cancellation.Token);
            if (!availability.IsAvailable)
            {
                _error = "Sala jest niedostępna w wybranym terminie. Wybierz inne godziny i spróbuj ponownie.";
                return;
            }
            _submitted = await ReservationsApi.CreateReservationAsync(request, _cancellation.Token);
            _form = new ReservationFormState();
        }
        catch (OperationCanceledException) when (_cancellation.IsCancellationRequested)
        {
            // Navigation disposed the component while its request was running.
        }
        catch (Exception ex)
        {
            _error = ApiErrorMessage.FromException(ex, "Nie udało się utworzyć rezerwacji");
        }
        finally
        {
            _busy = false;
        }
    }

    public async ValueTask DisposeAsync()
    {
        _cancellation.Cancel();
        _cancellation.Dispose();
        if (_module is not null)
        {
            await _module.DisposeAsync();
        }
    }
}
