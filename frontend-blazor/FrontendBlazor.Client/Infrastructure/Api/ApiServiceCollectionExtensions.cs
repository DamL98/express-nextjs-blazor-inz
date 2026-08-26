using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FrontendBlazor.Client.Infrastructure.Api;

public static class ApiServiceCollectionExtensions
{
    public static IServiceCollection AddExpressApi(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var configuredUrl = configuration["Api:BaseUrl"]?.Trim();

        if (!Uri.TryCreate(configuredUrl, UriKind.Absolute, out var apiUrl))
        {
            throw new InvalidOperationException(
                "Blad konfigu Api:BaseUrl");
        }

        if (!apiUrl.AbsoluteUri.EndsWith('/'))
        {
            apiUrl = new Uri($"{apiUrl.AbsoluteUri}/");
        }

        services.AddScoped(_ => new HttpClient
        {
            BaseAddress = apiUrl,
            Timeout = TimeSpan.FromSeconds(15),
        });
        services.AddScoped<ApiClient>();

        return services;
    }
}
