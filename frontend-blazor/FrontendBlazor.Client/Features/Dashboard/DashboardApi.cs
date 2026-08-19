using FrontendBlazor.Client.Features.Dashboard.DTOs;
using FrontendBlazor.Client.Infrastructure.Api;

namespace FrontendBlazor.Client.Features.Dashboard;

public sealed class DashboardApi(ApiClient apiClient)
{
    public Task<DashboardDto> GetDashboardAsync(
        CancellationToken cancellationToken = default) =>
        apiClient.ApiRequestAsync<DashboardDto>(
            "/dashboard",
            new ApiRequestOptions
            {
                IsBrowserCredentialRequired = true,
            },
            cancellationToken);
}
