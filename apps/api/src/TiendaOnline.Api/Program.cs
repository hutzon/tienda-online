using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
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
using TiendaOnline.Api.Modules.Billing;
using TiendaOnline.Api.Modules.Billing.Providers;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole(options =>
{
    options.IncludeScopes = true;
    options.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffZ";
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddAuth(builder.Configuration);
builder.Services.AddIdentityPersistence(builder.Configuration, builder.Environment);
builder.Services.AddCommercePersistence(builder.Configuration, builder.Environment);

builder.Services.AddHttpClient<IFelProvider, MockFelProvider>();

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors("AllowAll");

// Serve uploaded product images from wwwroot/uploads/ (local dev storage).
// The directory is created here so UseStaticFiles always has a valid PhysicalFileProvider.
var webRootPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(Path.Combine(webRootPath, "uploads", "products"));

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(webRootPath),
    RequestPath = "",
    ContentTypeProvider = new FileExtensionContentTypeProvider(),
});

// Correlation ID: propaga o genera un identificador por request para trazabilidad en logs.
app.Use(async (context, next) =>
{
    var correlationId = context.Request.Headers["X-Correlation-Id"].FirstOrDefault()
        ?? Guid.NewGuid().ToString("N")[..12];
    context.Response.Headers["X-Correlation-Id"] = correlationId;

    var logger = context.RequestServices.GetRequiredService<ILoggerFactory>()
        .CreateLogger("RequestLog");
    var sw = System.Diagnostics.Stopwatch.StartNew();
    await next(context);
    sw.Stop();

    logger.LogInformation(
        "HTTP {Method} {Path} → {StatusCode} in {ElapsedMs}ms [cid={CorrelationId}]",
        context.Request.Method,
        context.Request.Path,
        context.Response.StatusCode,
        sw.ElapsedMilliseconds,
        correlationId);
});

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
app.MapImageEndpoints();
app.MapInventoryEndpoints();
app.MapOrderEndpoints();
app.MapCheckoutEndpoints();
app.MapPaymentEndpoints();
app.MapBillingEndpoints();

app.Run();

// Expone Program para WebApplicationFactory en los tests de integración.
public partial class Program { }
