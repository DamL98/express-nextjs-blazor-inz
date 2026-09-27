using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Models.DTOs;
using Microsoft.AspNetCore.Components;

namespace FrontendBlazor.Client.Layout;

public partial class Topbar
{
    [Inject]
    private NavigationManager Navigation { get; set; } = default!;
    private bool _busy;
    private string? _error;

    private async Task HandleLogoutAsync()
    {
        _busy = true;
        _error = null;
        try
        {
            await Auth.LogoutAsync();
            Navigation.NavigateTo("/login", replace: true);
        }
        catch (Exception ex)
        {
            _error = ex.Message;
        }
        finally
        {
            _busy = false;
        }
    }
}
