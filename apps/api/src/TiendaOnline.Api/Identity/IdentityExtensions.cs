using Microsoft.EntityFrameworkCore;
using TiendaOnline.Api.Configuration;

namespace TiendaOnline.Api.Identity;

public static class IdentityExtensions
{
    public static IServiceCollection AddIdentityPersistence(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        var databaseOptions = configuration
            .GetSection(DatabaseOptions.SectionName)
            .Get<DatabaseOptions>()
            ?? throw new InvalidOperationException("Database configuration is not available.");

        services.AddDbContext<AppIdentityContext>(options =>
        {
            if (databaseOptions.UseInMemoryForTesting || environment.IsEnvironment("Testing"))
            {
                options.UseInMemoryDatabase($"{databaseOptions.InMemoryDatabaseName}-identity");
                return;
            }

            options.UseNpgsql(databaseOptions.ConnectionString);
            options.UseSnakeCaseNamingConvention();
        });

        return services;
    }
}
