using FrontendBlazor.Client.Features.Auth;
using FrontendBlazor.Client.Features.GoogleCalendar;
using FrontendBlazor.Client.Features.Reservations;
using FrontendBlazor.Client.Features.Rooms;
using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Infrastructure.Auth;
using FrontendBlazor.Client.Infrastructure.Browser;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.Services.AddExpressApi(builder.Configuration);
builder.Services.AddScoped<BackendAuthClient>();
builder.Services.AddScoped<BrowserDialogService>();
builder.Services.AddScoped<AuthContext>();
builder.Services.AddScoped<RoomsApi>();
builder.Services.AddScoped<ReservationsApi>();
builder.Services.AddScoped<GoogleCalendarApi>();

await builder.Build().RunAsync();
