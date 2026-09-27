using FrontendBlazor.Client.Services;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.Services.AddFrontendServices(builder.Configuration);

await builder.Build().RunAsync();
