using FrontendBlazor.Client.Models;
using FrontendBlazor.Client.Models.DTOs;
using Microsoft.AspNetCore.Components;

namespace FrontendBlazor.Client.Components.Rooms;

public partial class RoomList
{
    [Inject]
    private NavigationManager Navigation { get; set; } = default!;

    [Parameter, EditorRequired]
    public IReadOnlyList<RoomDto> Rooms { get; set; } = [];

    [SupplyParameterFromQuery(Name = "search")]
    public string? Search { get; set; }

    [SupplyParameterFromQuery(Name = "capacity")]
    public string? Capacity { get; set; }

    [SupplyParameterFromQuery(Name = "active")]
    public string? Active { get; set; }

    [SupplyParameterFromQuery(Name = "sort")]
    public string? Sort { get; set; }

    private void UpdateFilter(string name, string? value)
    {
        var uri = Navigation.GetUriWithQueryParameter(name, string.IsNullOrEmpty(value) ? null : value);
        Navigation.NavigateTo(uri, replace: true);
    }

    private void ClearFilters() => Navigation.NavigateTo("/rooms", replace: true);

}
