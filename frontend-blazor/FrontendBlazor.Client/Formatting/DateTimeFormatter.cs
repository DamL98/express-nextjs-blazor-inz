namespace FrontendBlazor.Client.Formatting;

public static class DateTimeFormatter
{
    public static string? Format(DateTimeOffset? value)
    {
        return value?.ToLocalTime().ToString("d MMM yyyy, HH:mm");
    }
}
