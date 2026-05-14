using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TiendaOnline.Api.Auth;

namespace TiendaOnline.Api.Endpoints;

public static class DevAuthEndpoints
{
    public static void MapDevAuthEndpoints(this IEndpointRouteBuilder app, IWebHostEnvironment env)
    {
        if (!env.IsDevelopment()) return;

        var group = app.MapGroup("/api/v1/auth/dev")
            .WithTags("Auth (Dev only)");

        group.MapPost("/token", (
            DevTokenRequest request,
            IOptions<AuthOptions> authOptions) =>
        {
            var options = authOptions.Value;

            if (string.IsNullOrWhiteSpace(request.Username))
                return Results.BadRequest(new { message = "Username is required." });

            if (string.IsNullOrWhiteSpace(request.Role))
                return Results.BadRequest(new { message = "Role is required." });

            if (string.IsNullOrWhiteSpace(options.SecretKey))
                return Results.Problem("Auth:SecretKey is not configured.", statusCode: 500);

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.SecretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(ClaimTypes.Name, request.Username),
                new(ClaimTypes.Role, request.Role),
                new(JwtRegisteredClaimNames.Sub, Guid.NewGuid().ToString()),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            var token = new JwtSecurityToken(
                issuer: options.Issuer,
                audience: options.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(options.TokenExpirationMinutes),
                signingCredentials: credentials);

            return Results.Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                expiresIn = options.TokenExpirationMinutes * 60,
                warning = "DEV ONLY. This endpoint is disabled in production."
            });
        })
        .WithName("DevToken");
    }
}

public sealed record DevTokenRequest(string Username, string Role);
