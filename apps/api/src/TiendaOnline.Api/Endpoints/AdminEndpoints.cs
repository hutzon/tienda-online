using TiendaOnline.Api.Auth;

namespace TiendaOnline.Api.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/admin")
            .WithTags("Admin")
            .RequireAuthorization(AppPolicies.RequireAdmin);

        group.MapGet("/ping", (HttpContext ctx) =>
        {
            var username = ctx.User.Identity?.Name ?? "unknown";
            var role = ctx.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "none";

            return Results.Ok(new
            {
                status = "ok",
                message = "Admin endpoint reached.",
                user = username,
                role
            });
        })
        .WithName("AdminPing");
    }
}
