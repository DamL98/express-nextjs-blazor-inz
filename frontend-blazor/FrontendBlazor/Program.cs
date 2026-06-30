using FrontendBlazor.Client.Features.Auth;
using FrontendBlazor.Client.Features.Rooms;
using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Infrastructure.Firebase;
using FrontendBlazor.Client.Pages;
using FrontendBlazor.Components;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents()
    .AddInteractiveWebAssemblyComponents();
builder.Services.AddExpressApi(builder.Configuration);
builder.Services.AddFirebaseAuthentication(builder.Configuration);
builder.Services.AddScoped<AuthContext>();
builder.Services.AddScoped<RoomsApi>();

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
