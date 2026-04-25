using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using TiendaOnline.Api.Auth;
using TiendaOnline.Api.Endpoints;
using TiendaOnline.Api.Identity;
using TiendaOnline.Api.Infrastructure;
using TiendaOnline.Api.Middleware;
using TiendaOnline.Api.Modules.Catalog;
using TiendaOnline.Api.Modules.Commerce;
using TiendaOnline.Api.Modules.Inventory;
using TiendaOnline.Api.Modules.Orders;
using TiendaOnline.Api.Modules.Checkout;
using TiendaOnline.Api.Modules.Payments;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole(options =>
{
    options.IncludeScopes = true;
    options.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffZ";
});

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddAuth(builder.Configuration);
builder.Services.AddIdentityPersistence(builder.Configuration, builder.Environment);
builder.Services.AddCommercePersistence(builder.Configuration, builder.Environment);

var app = builder.Build();

app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();

await app.TryPrepareCommerceDataAsync();

// Liveness: el proceso responde (siempre 200 si el API arranca).
app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = _ => false,
    ResultStatusCodes =
    {
        [HealthStatus.Healthy] = StatusCodes.Status200OK
    }
});

// Readiness: verifica dependencias reales (PostgreSQL, Redis).
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
    ResultStatusCodes =
    {
        [HealthStatus.Healthy] = StatusCodes.Status200OK,
        [HealthStatus.Degraded] = StatusCodes.Status200OK,
        [HealthStatus.Unhealthy] = StatusCodes.Status503ServiceUnavailable
    }
});

app.MapSystemEndpoints();
app.MapAdminEndpoints();
app.MapDevAuthEndpoints(app.Environment);
app.MapCatalogEndpoints();
app.MapInventoryEndpoints();
app.MapOrderEndpoints();
app.MapCheckoutEndpoints();
app.MapPaymentEndpoints();

app.Run();

// Expone Program para WebApplicationFactory en los tests de integración.
public partial class Program { }
