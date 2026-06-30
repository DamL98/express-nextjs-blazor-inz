using FrontendBlazor.Client.Features.Auth;
using FrontendBlazor.Client.Features.Rooms;
using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Infrastructure.Firebase;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.Services.AddExpressApi(builder.Configuration);
builder.Services.AddFirebaseAuthentication(builder.Configuration);
builder.Services.AddScoped<AuthContext>();
builder.Services.AddScoped<RoomsApi>();

await builder.Build().RunAsync();
