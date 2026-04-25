using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using TiendaOnline.Api.Identity;
using TiendaOnline.Api.Modules.Catalog.Entities;
using TiendaOnline.Api.Modules.Commerce;
using TiendaOnline.Api.Modules.Inventory.Entities;

namespace TiendaOnline.Api.Tests.Helpers;

public sealed class AuthTestWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"tienda-online-tests-{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Testing");
        Environment.SetEnvironmentVariable("DOTNET_ENVIRONMENT", "Testing");
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Auth:SecretKey"] = JwtTestHelper.TestSecretKey,
                ["Auth:Issuer"] = JwtTestHelper.TestIssuer,
                ["Auth:Audience"] = JwtTestHelper.TestAudience,
                ["Auth:TokenExpirationMinutes"] = "60",
                ["Database:UseInMemoryForTesting"] = "true",
                ["Database:InMemoryDatabaseName"] = _databaseName,
                ["Database:ApplySqlMigrationsOnStartup"] = "false",
                ["Database:SeedDevelopmentData"] = "false"
            });
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppIdentityContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppIdentityContext>>();
            services.RemoveAll<AppIdentityContext>();

            services.RemoveAll<DbContextOptions<AppCommerceContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppCommerceContext>>();
            services.RemoveAll<AppCommerceContext>();

            services.AddDbContext<AppIdentityContext>(options =>
                options.UseInMemoryDatabase($"{_databaseName}-identity"));

            services.AddDbContext<AppCommerceContext>(options =>
                options.UseInMemoryDatabase($"{_databaseName}-commerce"));
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        using var scope = host.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppCommerceContext>();
        dbContext.Database.EnsureCreated();
        SeedCommerceData(dbContext);

        return host;
    }

    private static void SeedCommerceData(AppCommerceContext dbContext)
    {
        if (dbContext.Products.Any(product => product.Slug == "integration-office-kit"))
        {
            return;
        }

        var category = new Category
        {
            Name = "Testing",
            Slug = "testing",
        };

        dbContext.Categories.Add(category);
        dbContext.Products.AddRange(
            new Product
            {
                Category = category,
                Name = "Integration Office Kit",
                Slug = "integration-office-kit",
                Sku = "TEST-001",
                Summary = "Producto de prueba para endpoints de catálogo.",
                Description = "Semilla de integración para validar flujo mínimo real.",
                Price = 150.00m,
                Currency = "GTQ",
                IsPublished = true,
                InventoryItem = new InventoryItem
                {
                    StockOnHand = 10,
                    UpdatedAt = DateTimeOffset.UtcNow,
                },
                UpdatedAt = DateTimeOffset.UtcNow,
            },
            new Product
            {
                Category = category,
                Name = "Integration Desk Light",
                Slug = "integration-desk-light",
                Sku = "TEST-002",
                Summary = "Segundo producto de prueba.",
                Description = "Producto auxiliar para pruebas de pedido.",
                Price = 95.00m,
                Currency = "GTQ",
                IsPublished = true,
                InventoryItem = new InventoryItem
                {
                    StockOnHand = 4,
                    UpdatedAt = DateTimeOffset.UtcNow,
                },
                UpdatedAt = DateTimeOffset.UtcNow,
            });

        dbContext.SaveChanges();
    }
}
