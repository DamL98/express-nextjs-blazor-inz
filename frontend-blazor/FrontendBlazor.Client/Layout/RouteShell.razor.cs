using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Infrastructure.Auth;
using FrontendBlazor.Client.Models.DTOs;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;

namespace FrontendBlazor.Client.Layout;

public partial class RouteShell : IDisposable
{
    [Inject]
    private AuthContext Auth { get; set; } = default!;

    [Inject]
    private NavigationManager Navigation { get; set; } = default!;

    private bool _isLoginPage;
    private bool _isAuthAction;

    protected override void OnInitialized()
    {
        Auth.Changed += HandleSessionChanged;
        Navigation.LocationChanged += HandleLocationChanged;
        UpdateCurrentPage();
    }

    protected override async Task OnAfterRenderAsync(bool isFirstRender)
    {
        if (!isFirstRender || !RendererInfo.IsInteractive)
        {
            return;
        }
        await Auth.InitializeAsync();
        ApplyRoutingRules();
    }

    public void Dispose()
    {
        Auth.Changed -= HandleSessionChanged;
        Navigation.LocationChanged -= HandleLocationChanged;
    }

    private void HandleSessionChanged() => RefreshRouting();

    private void HandleLocationChanged(object? sender, LocationChangedEventArgs args) =>
        RefreshRouting();

    private void RefreshRouting()
    {
        _ = InvokeAsync(() =>
        {
            ApplyRoutingRules();
            StateHasChanged();
        });
    }

    private void ApplyRoutingRules()
    {
        if (Auth.IsLoading)
        {
            return;
        }
        UpdateCurrentPage();
        if (_isAuthAction)
        {
            return;
        }
        if (!Auth.IsAuthenticated && !_isLoginPage)
        {
            Navigation.NavigateTo("/login", replace: true);
            return;
        }
        if (Auth.IsAuthenticated && _isLoginPage)
        {
            Navigation.NavigateTo("/", replace: true);
        }
    }

    private void UpdateCurrentPage()
    {
        var relativePath = Navigation.ToBaseRelativePath(Navigation.Uri);
        var path = relativePath.Split(['?', '#'], 2)[0];
        _isLoginPage = path.Equals("login", StringComparison.OrdinalIgnoreCase);
        _isAuthAction = path.Equals("auth/action", StringComparison.OrdinalIgnoreCase);
    }
}
