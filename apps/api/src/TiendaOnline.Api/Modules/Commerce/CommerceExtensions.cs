using Microsoft.EntityFrameworkCore;
using Npgsql;
using TiendaOnline.Api.Configuration;
using TiendaOnline.Api.Modules.Catalog.Entities;
using TiendaOnline.Api.Modules.Inventory.Entities;

namespace TiendaOnline.Api.Modules.Commerce;

public static class CommerceExtensions
{
    public static IServiceCollection AddCommercePersistence(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        var databaseOptions = configuration
            .GetSection(DatabaseOptions.SectionName)
            .Get<DatabaseOptions>()
            ?? throw new InvalidOperationException(
                "Database configuration is not available.");

        services.AddDbContext<AppCommerceContext>(options =>
        {
            if (databaseOptions.UseInMemoryForTesting || environment.IsEnvironment("Testing"))
            {
                options.UseInMemoryDatabase($"{databaseOptions.InMemoryDatabaseName}-commerce");
                return;
            }

            options.UseNpgsql(databaseOptions.ConnectionString);
        });

        return services;
    }

    public static async Task TryPrepareCommerceDataAsync(this WebApplication app)
    {
        var logger = app.Services.GetRequiredService<ILoggerFactory>()
            .CreateLogger("CommerceStartup");
        var databaseOptions = app.Services.GetRequiredService<IConfiguration>()
            .GetSection(DatabaseOptions.SectionName)
            .Get<DatabaseOptions>()
            ?? new DatabaseOptions();

        if (databaseOptions.ApplySqlMigrationsOnStartup)
        {
            try
            {
                await ApplySqlMigrationsAsync(databaseOptions.ConnectionString, app.Environment, logger);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Commerce SQL migrations could not be applied automatically.");
            }
        }

        if (app.Environment.IsDevelopment() && databaseOptions.SeedDevelopmentData)
        {
            try
            {
                await SeedDevelopmentDataAsync(app.Services, logger);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Commerce development seed could not be applied.");
            }
        }
    }

    private static async Task ApplySqlMigrationsAsync(
        string connectionString,
        IWebHostEnvironment environment,
        ILogger logger)
    {
        var migrationsPath = Path.GetFullPath(Path.Combine(
            environment.ContentRootPath,
            "..", "..", "..", "..",
            "infra", "db", "migrations"));

        if (!Directory.Exists(migrationsPath))
        {
            logger.LogWarning("Migrations path not found: {Path}", migrationsPath);
            return;
        }

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();

        await using (var ensureCommand = connection.CreateCommand())
        {
            ensureCommand.CommandText = """
                CREATE TABLE IF NOT EXISTS public.__schema_migrations (
                    file_name VARCHAR(255) NOT NULL PRIMARY KEY,
                    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
                );
                """;
            await ensureCommand.ExecuteNonQueryAsync();
        }

        foreach (var filePath in Directory.GetFiles(migrationsPath, "*.sql").OrderBy(path => path))
        {
            var fileName = Path.GetFileName(filePath);

            await using var checkCommand = connection.CreateCommand();
            checkCommand.CommandText =
                "SELECT EXISTS (SELECT 1 FROM public.__schema_migrations WHERE file_name = @fileName);";
            checkCommand.Parameters.AddWithValue("fileName", fileName);

            var alreadyApplied = (bool)(await checkCommand.ExecuteScalarAsync() ?? false);
            if (alreadyApplied)
            {
                continue;
            }

            var sql = await File.ReadAllTextAsync(filePath);
            await using var transaction = await connection.BeginTransactionAsync();

            try
            {
                await using var migrationCommand = connection.CreateCommand();
                migrationCommand.Transaction = transaction;
                migrationCommand.CommandText = sql;
                await migrationCommand.ExecuteNonQueryAsync();

                await using var markCommand = connection.CreateCommand();
                markCommand.Transaction = transaction;
                markCommand.CommandText =
                    "INSERT INTO public.__schema_migrations (file_name) VALUES (@fileName);";
                markCommand.Parameters.AddWithValue("fileName", fileName);
                await markCommand.ExecuteNonQueryAsync();

                await transaction.CommitAsync();
                logger.LogInformation("Applied SQL migration {MigrationFile}.", fileName);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }

    private static async Task SeedDevelopmentDataAsync(IServiceProvider services, ILogger logger)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppCommerceContext>();

        if (await dbContext.Products.AnyAsync())
        {
            return;
        }

        var workspaceCategory = new Category
        {
            Name = "Workspace",
            Slug = "workspace",
        };

        var mobilityCategory = new Category
        {
            Name = "Mobility",
            Slug = "mobility",
        };

        var products = new[]
        {
            new Product
            {
                Category = workspaceCategory,
                Name = "Starter Office Kit",
                Slug = "starter-office-kit",
                Sku = "WS-STARTER-001",
                Summary = "Kit base para oficina y home office con envío local.",
                Description = "Producto de desarrollo para validar catálogo, stock y pedidos sin implementar checkout final.",
                Price = 299.00m,
                Currency = "GTQ",
                IsPublished = true,
                InventoryItem = new InventoryItem
                {
                    StockOnHand = 18,
                },
            },
            new Product
            {
                Category = workspaceCategory,
                Name = "Smart Desk Light",
                Slug = "smart-desk-light",
                Sku = "WS-LIGHT-002",
                Summary = "Lámpara LED ajustable para escritorios de trabajo.",
                Description = "Ejemplo de producto real con stock simple por producto y sin variantes todavía.",
                Price = 179.00m,
                Currency = "GTQ",
                IsPublished = true,
                InventoryItem = new InventoryItem
                {
                    StockOnHand = 9,
                },
            },
            new Product
            {
                Category = mobilityCategory,
                Name = "Carry Everyday Backpack",
                Slug = "carry-everyday-backpack",
                Sku = "MB-BACKPACK-003",
                Summary = "Mochila urbana para laptop y accesorios de trabajo.",
                Description = "Producto semilla para probar navegación pública, visibilidad en admin y creación de pedidos base.",
                Price = 425.00m,
                Currency = "GTQ",
                IsPublished = true,
                InventoryItem = new InventoryItem
                {
                    StockOnHand = 6,
                },
            },
        };

        await dbContext.Categories.AddRangeAsync(workspaceCategory, mobilityCategory);
        await dbContext.Products.AddRangeAsync(products);
        await dbContext.SaveChangesAsync();

        logger.LogInformation("Development commerce seed applied with {ProductCount} products.", products.Length);
    }
}
