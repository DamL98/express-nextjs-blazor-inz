using FrontendBlazor.Client.Features.Auth;
using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Infrastructure.Browser;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.Services.AddExpressApi(builder.Configuration);
builder.Services.AddScoped<BrowserDialogService>();
builder.Services.AddScoped<AuthContext>();

await builder.Build().RunAsync();
