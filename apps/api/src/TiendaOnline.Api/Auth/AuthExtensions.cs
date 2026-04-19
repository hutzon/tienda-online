using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace TiendaOnline.Api.Auth;

public static class AuthExtensions
{
    public static IServiceCollection AddAuth(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<AuthOptions>(configuration.GetSection(AuthOptions.SectionName));

        // AddJwtBearer sin parámetros, la configuración real se aplica abajo via IOptions
        // para que WebApplicationFactory pueda sobrescribir el SecretKey antes de que
        // el token de validación sea construido por el contenedor DI.
        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer();

        // Configura JwtBearerOptions leyendo AuthOptions de forma lazy (IOptions),
        // lo que garantiza que las sobreescrituras de configuración de los tests
        // se apliquen correctamente.
        services
            .AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<AuthOptions>>((jwtOptions, authOptions) =>
            {
                var opts = authOptions.Value;
                jwtOptions.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = opts.Issuer,
                    ValidAudience = opts.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(opts.SecretKey)),
                    ClockSkew = TimeSpan.FromSeconds(30)
                };
            });

        services
            .AddAuthorizationBuilder()
            .AddPolicy(AppPolicies.RequireAdmin, policy =>
                policy.RequireRole(AppRoles.Admin))
            .AddPolicy(AppPolicies.RequireStaff, policy =>
                policy.RequireRole(AppRoles.Admin, AppRoles.Staff));

        return services;
    }
}
