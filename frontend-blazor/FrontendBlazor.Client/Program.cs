using FrontendBlazor.Client.Infrastructure.Auth;
using FrontendBlazor.Client.Infrastructure.Api;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.Services.AddExpressApi(builder.Configuration);
builder.Services.AddScoped<AuthContext>();

await builder.Build().RunAsync();
