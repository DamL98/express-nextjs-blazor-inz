using FrontendBlazor.Client.Features.Auth;
using FrontendBlazor.Client.Features.GoogleCalendar;
using FrontendBlazor.Client.Features.Reservations;
using FrontendBlazor.Client.Features.Rooms;
using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Infrastructure.Auth;
using FrontendBlazor.Client.Infrastructure.Browser;
using FrontendBlazor.Client.Pages;
using FrontendBlazor.Components;
using Microsoft.AspNetCore.DataProtection;

var builder = WebApplication.CreateBuilder(args);

if (builder.Configuration.GetValue<bool>(
    "Measurement:UseEphemeralDataProtection"))
{
    builder.Services.AddDataProtection()
        .UseEphemeralDataProtectionProvider();
}

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents()
    .AddInteractiveWebAssemblyComponents();
builder.Services.AddExpressApi(builder.Configuration);
builder.Services.AddScoped<BackendAuthClient>();
builder.Services.AddScoped<BrowserDialogService>();
builder.Services.AddScoped<AuthContext>();
builder.Services.AddScoped<RoomsApi>();
builder.Services.AddScoped<ReservationsApi>();
builder.Services.AddScoped<GoogleCalendarApi>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseWebAssemblyDebugging();
}
else
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
}
app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);
app.UseAntiforgery();

app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode()
    .AddInteractiveWebAssemblyRenderMode()
    .AddAdditionalAssemblies(typeof(FrontendBlazor.Client._Imports).Assembly);

app.Run();
