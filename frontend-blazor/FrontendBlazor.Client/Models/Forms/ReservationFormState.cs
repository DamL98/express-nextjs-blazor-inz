using System.Globalization;
using FrontendBlazor.Client.Models.DTOs;

namespace FrontendBlazor.Client.Models.Forms;

public sealed class ReservationFormState
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public bool HasStart => TryDate(StartTime, out _);
    public double DurationMinutes => TryDate(StartTime, out var start) && TryDate(EndTime, out var end)
        ? Math.Round((end.ToUniversalTime() - start.ToUniversalTime()).TotalMinutes)
        : 0;
    public bool HasInvalidRange => HasStart && TryDate(EndTime, out _) && DurationMinutes <= 0;

    public void SetDuration(int minutes)
    {
        if (TryDate(StartTime, out var start))
        {
            EndTime = start.ToUniversalTime().AddMinutes(minutes).ToLocalTime()
                .ToString("yyyy-MM-ddTHH:mm", CultureInfo.InvariantCulture);
        }
    }

    public FormValidationError? ValidateForm()
    {
        if (string.IsNullOrWhiteSpace(Title))
        {
            return new("title", "Tytuł jest wymagany");
        }
        if (!HasStart)
        {
            return new("startTime", "Podaj prawidłowy początek rezerwacji");
        }
        if (!TryDate(EndTime, out _) || HasInvalidRange)
        {
            return new("endTime", "Koniec musi być po starcie rezerwacji");
        }
        return null;
    }

    public CreateReservationRequestDto ToRequest(string roomId)
    {
        if (ValidateForm() is not null)
        {
            throw new InvalidOperationException("Formularz zawiera błędy");
        }
        TryDate(StartTime, out var start);
        TryDate(EndTime, out var end);
        return new CreateReservationRequestDto(
            roomId,
            Title.Trim(),
            string.IsNullOrWhiteSpace(Description) ? null : Description.Trim(),
            start.ToUniversalTime().ToString("O"),
            end.ToUniversalTime().ToString("O"));
    }

    private static bool TryDate(string input, out DateTime date) =>
        DateTime.TryParse(input, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out date);
}
