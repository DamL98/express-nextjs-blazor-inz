using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Infrastructure.Auth;
using FrontendBlazor.Client.Models;
using FrontendBlazor.Client.Models.DTOs;
using FrontendBlazor.Client.Services;
using Microsoft.AspNetCore.Components;

namespace FrontendBlazor.Client.Pages.Login;

public partial class LoginPage
{
    private static readonly (LoginMode Key, string Label)[] Modes =
    [
        (LoginMode.Login, "Logowanie"),
        (LoginMode.Register, "Rejestracja"),
        (LoginMode.ForgotPassword, "Nie pamietam hasla"),
        (LoginMode.VerifyEmail, "Wyslij ponownie potwierdzenie"),
    ];

    [Inject]
    private AuthContext Auth { get; set; } = default!;
    [Inject]
    private AuthService Authentication { get; set; } = default!;
    [Inject]
    private NavigationManager Navigation { get; set; } = default!;
    private LoginMode _mode = LoginMode.Login;
    private string _email = string.Empty;
    private string _password = string.Empty;
    private string _fullName = string.Empty;
    private string? _message;
    private string? _errorMessage;
    private bool _isSubmitting;
    private string Heading => _mode switch
    {
        LoginMode.Register => "Utworz konto",
        LoginMode.ForgotPassword => "Reset hasla",
        LoginMode.VerifyEmail => "Potwierdz e-mail",
        _ => "Zaloguj sie",
    };
    private string SubmitLabel => _isSubmitting ? "Prosze czekac..." : _mode switch
    {
        LoginMode.Login => "Zaloguj sie",
        LoginMode.Register => "Zarejestruj sie",
        _ => "Wyslij link",
    };

    protected override void OnInitialized()
    {
        var query = System.Web.HttpUtility.ParseQueryString(new Uri(Navigation.Uri).Query);
        if (query["auth"] == "error")
        {
            _errorMessage = query["reason"] == "account_link_conflict"
                ? "Zaloguj sie dotychczasowa metoda i polacz Google na stronie rezerwacji."
                : "Logowanie Google nie powiodlo sie. Sprobuj ponownie.";
        }
    }

    private void SetMode(LoginMode mode)
    {
        _mode = mode;
        _message = null;
        _errorMessage = null;
        _password = string.Empty;
    }

    private async Task SubmitAsync()
    {
        if (_isSubmitting)
        {
            return;
        }
        _isSubmitting = true;
        _errorMessage = null;
        _message = null;
        try
        {
            if (_mode == LoginMode.Login)
            {
                await Auth.LoginLocalAsync(_email, _password);
                return;
            }
            var request = new AccountEmailRequest(
                _email, _password, _fullName, new Uri(new Uri(Navigation.BaseUri), "auth/action").ToString());
            var result = _mode switch
            {
                LoginMode.Register => await Authentication.RegisterAsync(request),
                LoginMode.ForgotPassword => await Authentication.RequestPasswordResetAsync(request),
                LoginMode.VerifyEmail => await Authentication.RequestVerificationAsync(request),
                _ => throw new InvalidOperationException("Nieznany tryb logowania"),
            };
            _message = result.Message;
        }
        catch (Exception exception)
        {
            _errorMessage = ApiErrorMessage.FromException(exception, "Operacja nie powiodla sie");
        }
        finally
        {
            _isSubmitting = false;
        }
    }

    private async Task GoogleLoginAsync()
    {
        _errorMessage = null;
        _isSubmitting = true;
        try
        {
            await Auth.LoginWithGoogleAsync();
        }
        catch (Exception exception)
        {
            _errorMessage = exception.Message;
            _isSubmitting = false;
        }
    }
}
