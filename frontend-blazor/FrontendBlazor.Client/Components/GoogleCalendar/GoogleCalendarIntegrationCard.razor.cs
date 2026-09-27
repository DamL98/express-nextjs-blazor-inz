using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Infrastructure.Auth;
using FrontendBlazor.Client.Models.DTOs;
using FrontendBlazor.Client.Services;
using Microsoft.AspNetCore.Components;

namespace FrontendBlazor.Client.Components.GoogleCalendar;

public partial class GoogleCalendarIntegrationCard : IDisposable
{
    [Inject]
    private GoogleCalendarService CalendarApi { get; set; } = default!;

    [Inject]
    private NavigationManager Navigation { get; set; } = default!;

    [Inject]
    private AuthContext Auth { get; set; } = default!;

    [Parameter]
    public string? CallbackStatus { get; set; }

    [Parameter]
    public string? CallbackReason { get; set; }
    private readonly CancellationTokenSource _cancellation = new();
    private GoogleCalendarConnectionStatusDto? _status;
    private bool _loading = true;
    private string? _error;
    private string CallbackMessage => CallbackStatus == "connected" ? "Kalendarz Google został połączony." : CallbackReason switch
    {
        "access_denied" => "Łączenie kalendarza zostało anulowane. Możesz spróbować ponownie.",
        "google_account_mismatch" => "Wybierz konto Google połączone z Twoim kontem aplikacji.",
        "google_refresh_token_missing" => "Nie udało się uzyskać dostępu do kalendarza. Połącz ponownie.",
        _ => "Nie udało się dokończyć połączenia. Spróbuj ponownie."
    };

    protected override Task OnInitializedAsync() => LoadAsync();

    private async Task LoadAsync()
    {
        _loading = true;
        _error = null;
        try
        {
            _status = await CalendarApi.GetStatusAsync(_cancellation.Token);
        }
        catch (OperationCanceledException) when (_cancellation.IsCancellationRequested)
        {
            // Navigation disposed the component while its request was running.
        }
        catch (Exception ex)
        {
            _error = ApiErrorMessage.FromException(ex, "Nie można sprawdzić połączenia");
        }
        finally
        {
            _loading = false;
        }
    }

    private void HandleConnect()
    {
        Navigation.NavigateTo(CalendarApi.GetConnectionUri(Navigation.Uri).ToString(), forceLoad: true);
    }

    public void Dispose()
    {
        _cancellation.Cancel();
        _cancellation.Dispose();
    }
}
