using Microsoft.EntityFrameworkCore;
using TiendaOnline.Api.Configuration;

namespace TiendaOnline.Api.Identity;

public static class IdentityExtensions
{
    public static IServiceCollection AddIdentityPersistence(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration
            .GetSection(DatabaseOptions.SectionName)
            .Get<DatabaseOptions>()?.ConnectionString
            ?? throw new InvalidOperationException(
                "Database:ConnectionString is not configured.");

        services.AddDbContext<AppIdentityContext>(options =>
            options.UseNpgsql(connectionString));

        return services;
    }
}
