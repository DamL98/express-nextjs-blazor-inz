using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Infrastructure.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FrontendBlazor.Client.Services;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddFrontendServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddExpressApi(configuration);
        services.AddScoped<AuthService>();
        services.AddScoped<AuthContext>();
        services.AddScoped<RoomsService>();
        services.AddScoped<ReservationsService>();
        services.AddScoped<DashboardService>();
        services.AddScoped<GoogleCalendarService>();
        return services;
    }
}
