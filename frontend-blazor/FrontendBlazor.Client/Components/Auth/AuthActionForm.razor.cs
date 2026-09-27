using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Models.DTOs;
using FrontendBlazor.Client.Services;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace FrontendBlazor.Client.Components.Auth;

public partial class AuthActionForm
{
    [Inject]
    private AuthService Authentication { get; set; } = default!;

    [Inject]
    private NavigationManager Navigation { get; set; } = default!;

    [Inject]
    private IJSRuntime JS { get; set; } = default!;

    private string _action = "";
    private string _token = "";
    private string _password = "";
    private string? _message;
    private string? _error;
    private bool _busy;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (!firstRender || !RendererInfo.IsInteractive)
        {
            return;
        }
        var uri = new Uri(Navigation.Uri);
        var data = System.Web.HttpUtility.ParseQueryString(uri.Fragment.TrimStart('#'));
        _action = data["action"] ?? "";
        _token = data["token"] ?? "";
        await JS.InvokeVoidAsync("history.replaceState", (object?)null, "", uri.AbsolutePath);
        StateHasChanged();
    }

    private async Task SubmitAsync()
    {
        _busy = true;
        _error = null;
        try
        {
            var request = new AccountActionRequest(_token, _password);
            var result = _action == "verify-email"
                ? await Authentication.VerifyEmailAsync(request)
                : await Authentication.ResetPasswordAsync(request);
            _message = result.Message;
            _token = "";
            _password = "";
        }
        catch (Exception exception)
        {
            _error = ApiErrorMessage.FromException(exception, "Nieprawidlowy link");
        }
        finally
        {
            _busy = false;
        }
    }
}
