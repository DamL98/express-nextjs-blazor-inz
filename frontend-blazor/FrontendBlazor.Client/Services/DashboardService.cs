using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Models.DTOs;

namespace FrontendBlazor.Client.Services;

public sealed class DashboardService(ApiClient api)
{
    public Task<DashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default) =>
        api.ApiRequestAsync<DashboardDto>("/dashboard", new ApiRequestOptions
        {
            IsBrowserCredentialRequired = true,
        }, cancellationToken);
}
