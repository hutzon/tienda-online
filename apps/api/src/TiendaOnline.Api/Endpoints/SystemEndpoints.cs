using Microsoft.Extensions.Options;
using TiendaOnline.Api.Configuration;

namespace TiendaOnline.Api.Endpoints;

public static class SystemEndpoints
{
    public static void MapSystemEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/system").WithTags("System");

        group.MapGet("/info", (
            IOptions<AppOptions> appOptions,
            IWebHostEnvironment env) =>
        {
            return Results.Ok(new
            {
                name = appOptions.Value.Name,
                version = appOptions.Value.Version,
                environment = env.EnvironmentName,
                timestamp = DateTimeOffset.UtcNow
            });
        })
        .WithName("GetSystemInfo");
    }
}
