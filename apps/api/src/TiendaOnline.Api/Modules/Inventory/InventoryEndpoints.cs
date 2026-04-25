using Microsoft.EntityFrameworkCore;
using TiendaOnline.Api.Auth;
using TiendaOnline.Api.Modules.Catalog;
using TiendaOnline.Api.Modules.Commerce;

namespace TiendaOnline.Api.Modules.Inventory;

public static class InventoryEndpoints
{
    public static void MapInventoryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/admin/inventory")
            .WithTags("Admin Inventory")
            .RequireAuthorization(AppPolicies.RequireAdmin);

        group.MapGet("/products", async (AppCommerceContext dbContext) =>
        {
            var inventory = await dbContext.Products
                .AsNoTracking()
                .Include(product => product.Category)
                .Include(product => product.InventoryItem)
                .OrderBy(product => product.Name)
                .Select(product => new AdminInventoryProductRow(
                    product.Id,
                    product.Name,
                    product.Sku,
                    product.Category.Name,
                    product.InventoryItem.StockOnHand,
                    product.IsPublished,
                    product.UpdatedAt))
                .ToListAsync();

            return Results.Ok(inventory);
        })
        .WithName("GetAdminInventoryProducts");

        group.MapPut("/products/{id:guid}/stock", async (
            Guid id,
            UpdateStockRequest request,
            AppCommerceContext dbContext,
            CancellationToken cancellationToken) =>
        {
            if (request.StockOnHand < 0)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["stockOnHand"] = ["Stock cannot be negative."]
                });
            }

            var product = await dbContext.Products
                .Include(existingProduct => existingProduct.Category)
                .Include(existingProduct => existingProduct.InventoryItem)
                .FirstOrDefaultAsync(existingProduct => existingProduct.Id == id, cancellationToken);

            if (product is null)
            {
                return Results.NotFound(new { message = "Product not found." });
            }

            product.InventoryItem.StockOnHand = request.StockOnHand;
            product.InventoryItem.UpdatedAt = DateTimeOffset.UtcNow;
            product.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(product.ToAdminSummary());
        })
        .WithName("UpdateAdminProductStock");
    }
}

public sealed record UpdateStockRequest(int StockOnHand);

public sealed record AdminInventoryProductRow(
    Guid Id,
    string Name,
    string Sku,
    string CategoryName,
    int StockOnHand,
    bool IsPublished,
    DateTimeOffset UpdatedAt);
