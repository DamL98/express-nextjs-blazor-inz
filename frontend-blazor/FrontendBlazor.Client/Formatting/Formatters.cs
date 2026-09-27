namespace FrontendBlazor.Client.Formatting;

public static class Formatters
{
    public static string? FormatDateTime(DateTimeOffset? value)
    {
        return value?.ToLocalTime().ToString("d MMM yyyy, HH:mm", System.Globalization.CultureInfo.GetCultureInfo("pl-PL"));
    }
}
