using Microsoft.JSInterop;

namespace FrontendBlazor.Client.Infrastructure.Browser;

public sealed class BrowserDialogService(IJSRuntime jsRuntime) : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _module = new(
        () => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./js/backend-auth.js").AsTask());

    public async Task<bool> ConfirmAsync(string message)
    {
        var module = await _module.Value;
        return await module.InvokeAsync<bool>("confirmAction", message);
    }

    public async ValueTask DisposeAsync()
    {
        if (_module.IsValueCreated)
        {
            var module = await _module.Value;
            await module.DisposeAsync();
        }
    }
}
