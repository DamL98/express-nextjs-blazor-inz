using Microsoft.JSInterop;

namespace FrontendBlazor.Client.Infrastructure.Browser;

public sealed class BrowserDialogService(IJSRuntime jsRuntime)
{
    public ValueTask<bool> ConfirmAsync(string message) =>
        jsRuntime.InvokeAsync<bool>("confirm", message);
}
