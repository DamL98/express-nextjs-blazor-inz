using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Infrastructure.Auth;
using FrontendBlazor.Client.Models.DTOs;
using FrontendBlazor.Client.Services;
using Microsoft.AspNetCore.Components;

namespace FrontendBlazor.Client.Components.Auth;

public partial class AccountSecurityCard
{
    [Inject]
    private AuthService Authentication { get; set; } = default!;

    [Inject]
    private AuthContext Auth { get; set; } = default!;

    [Inject]
    private NavigationManager Navigation { get; set; } = default!;
    private string _currentPassword = "";
    private string _password = "";
    private string? _error;
    private string? _message;
    private string? _callbackMessage;
    private bool _busy;

    protected override void OnParametersSet()
    {
        var query = System.Web.HttpUtility.ParseQueryString(new Uri(Navigation.Uri).Query);
        _callbackMessage = query["googleLink"] switch
        {
            null => null,
            "success" => "Konto Google połączone.",
            _ => "Nie udało się połączyć Google. Konto może już należeć do innego użytkownika; spróbuj ponownie.",
        };
    }

    private Task LinkAsync() => SubmitAsync(true);

    private Task ChangePasswordAsync() => SubmitAsync(false);

    private async Task SubmitAsync(bool link)
    {
        if (_busy)
        {
            return;
        }
        _error = _message = null;
        if (_currentPassword.Length is < 12 or > 128)
        {
            _error = "Podaj aktualne hasło (od 12 do 128 znaków).";
            return;
        }
        if (!link && _password.Length is < 12 or > 128)
        {
            _error = "Nowe hasło musi mieć od 12 do 128 znaków.";
            return;
        }
        _busy = true;
        try
        {
            if (link)
            {
                var result = await Authentication.LinkGoogleAsync(_currentPassword, Navigation.Uri);
                Navigation.NavigateTo(result.AuthorizationUrl, forceLoad: true);
            }
            else
            {
                await Authentication.ChangePasswordAsync(_currentPassword, _password);
                _currentPassword = _password = "";
                _message = "Hasło zmienione";
            }
        }
        catch (Exception ex)
        {
            _error = ApiErrorMessage.FromException(ex, "Operacja nie powiodła się");
        }
        finally
        {
            _busy = false;
        }
    }
}
