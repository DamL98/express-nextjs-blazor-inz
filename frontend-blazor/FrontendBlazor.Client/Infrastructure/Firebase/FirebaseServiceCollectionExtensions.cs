using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FrontendBlazor.Client.Infrastructure.Firebase;

public static class FirebaseServiceCollectionExtensions
{
    public static IServiceCollection AddFirebaseAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var firebaseConfig = new FirebaseConfig
        {
            ApiKey = configuration["Firebase:ApiKey"] ?? string.Empty,
            AuthDomain = configuration["Firebase:AuthDomain"] ?? string.Empty,
            ProjectId = configuration["Firebase:ProjectId"] ?? string.Empty,
            StorageBucket = configuration["Firebase:StorageBucket"] ?? string.Empty,
            MessagingSenderId = configuration["Firebase:MessagingSenderId"] ?? string.Empty,
            AppId = configuration["Firebase:AppId"] ?? string.Empty,
        };

        if (string.IsNullOrWhiteSpace(firebaseConfig.ApiKey) ||
            string.IsNullOrWhiteSpace(firebaseConfig.AuthDomain) ||
            string.IsNullOrWhiteSpace(firebaseConfig.ProjectId) ||
            string.IsNullOrWhiteSpace(firebaseConfig.AppId))
        {
            throw new InvalidOperationException(
                "Brak konfiguracji firebase w appsettings");
        }

        services.AddSingleton(firebaseConfig);
        services.AddScoped<FirebaseAuth>();

        return services;
    }
}
