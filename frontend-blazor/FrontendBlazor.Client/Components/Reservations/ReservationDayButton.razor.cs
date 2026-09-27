using System.Globalization;
using FrontendBlazor.Client.Helpers;
using FrontendBlazor.Client.Models.DTOs;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;

namespace FrontendBlazor.Client.Components.Reservations;

public partial class ReservationDayButton
{
    private static readonly CultureInfo Polish = CultureInfo.GetCultureInfo("pl-PL");
    private ElementReference _button;
    private int _count;

    [Parameter]
    public DateTime Day { get; set; }

    [Parameter]
    public DateTime Month { get; set; }

    [Parameter]
    public DateTime SelectedDay { get; set; }

    [Parameter, EditorRequired]
    public IReadOnlyList<ReservationDto> Reservations { get; set; } = [];

    [Parameter]
    public EventCallback<DateTime> OnSelect { get; set; }

    [Parameter]
    public EventCallback<KeyboardEventArgs> OnKeyDown { get; set; }

    [Parameter]
    public bool FocusRequested { get; set; }

    [Parameter]
    public EventCallback OnFocused { get; set; }

    protected override void OnParametersSet() =>
        _count = ReservationCalendarHelper.GetDayReservations(Reservations, Day).Count();

    private static string LocalDateKey(DateTime day) => day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (FocusRequested)
        {
            await _button.FocusAsync(preventScroll: true);
            await OnFocused.InvokeAsync();
        }
    }
}
