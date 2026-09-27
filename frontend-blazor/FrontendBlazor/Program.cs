using FrontendBlazor.Client.Services;
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
builder.Services.AddFrontendServices(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsEnvironment("Measurement"))
{
    app.MapGet("/measurement-info", () => new
    {
        production = !app.Environment.IsDevelopment(),
        environment = app.Environment.EnvironmentName,
        api = app.Configuration["Api:BaseUrl"]?.TrimEnd('/'),
        renderer = "webassembly",
    });
}

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
