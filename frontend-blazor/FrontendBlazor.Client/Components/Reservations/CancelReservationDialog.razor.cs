using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Models.DTOs;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace FrontendBlazor.Client.Components.Reservations;

public partial class CancelReservationDialog : IAsyncDisposable
{
    [Inject]
    private IJSRuntime JS { get; set; } = default!;

    [Parameter, EditorRequired]
    public ReservationDto Reservation { get; set; } = default!;

    [Parameter]
    public bool Busy { get; set; }

    [Parameter]
    public string? Error { get; set; }

    [Parameter]
    public EventCallback OnClose { get; set; }

    [Parameter]
    public EventCallback OnConfirm { get; set; }
    private ElementReference _dialog;
    private IJSObjectReference? _module;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            _module = await JS.InvokeAsync<IJSObjectReference>("import", "./js/ui.js");
            await _module.InvokeVoidAsync("showDialog", _dialog);
        }
    }

    private async Task Close()
    {
        if (!Busy)
        {
            await OnClose.InvokeAsync();
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_module is not null)
        {
            await _module.DisposeAsync();
        }
    }
}
