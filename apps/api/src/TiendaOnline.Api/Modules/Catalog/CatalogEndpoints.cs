using Microsoft.EntityFrameworkCore;
using TiendaOnline.Api.Auth;
using TiendaOnline.Api.Modules.Commerce;
using TiendaOnline.Api.Modules.Catalog.Entities;

namespace TiendaOnline.Api.Modules.Catalog;

public static class CatalogEndpoints
{
    public static void MapCatalogEndpoints(this IEndpointRouteBuilder app)
    {
        var publicGroup = app.MapGroup("/api/v1/catalog")
            .WithTags("Catalog");

        publicGroup.MapGet("/products", async (AppCommerceContext dbContext) =>
        {
            var products = await dbContext.Products
                .AsNoTracking()
                .Include(product => product.Category)
                .Include(product => product.InventoryItem)
                .Include(product => product.Images)
                .Where(product => product.IsPublished)
                .OrderBy(product => product.Name)
                .ToListAsync();

            return Results.Ok(products.Select(product => product.ToPublicSummary()).ToList());
        })
        .WithName("GetPublicCatalogProducts");

        publicGroup.MapGet("/products/{slug}", async (string slug, AppCommerceContext dbContext) =>
        {
            var product = await dbContext.Products
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.InventoryItem)
                .Include(p => p.Images)
                .Where(p => p.IsPublished && p.Slug == slug)
                .FirstOrDefaultAsync();

            return product is null
                ? Results.NotFound(new { message = "Product not found." })
                : Results.Ok(product.ToPublicDetail());
        })
        .WithName("GetPublicCatalogProductBySlug");

        var adminGroup = app.MapGroup("/api/v1/admin/catalog")
            .WithTags("Admin Catalog")
            .RequireAuthorization(AppPolicies.RequireAdmin);

        adminGroup.MapGet("/products", async (AppCommerceContext dbContext) =>
        {
            var products = await dbContext.Products
                .AsNoTracking()
                .Include(product => product.Category)
                .Include(product => product.InventoryItem)
                .Include(product => product.Images)
                .OrderBy(product => product.Name)
                .ToListAsync();

            return Results.Ok(products.Select(product => product.ToAdminSummary()).ToList());
        })
        .WithName("GetAdminProducts");

        adminGroup.MapPost("/products", async (
            UpsertProductRequest request,
            AppCommerceContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var validationError = ValidateUpsertRequest(request);
            if (validationError is not null)
            {
                return Results.ValidationProblem(validationError);
            }

            var category = await GetOrCreateCategoryAsync(request.CategoryName, dbContext, cancellationToken);
            var slug = CommerceText.ToSlug(string.IsNullOrWhiteSpace(request.Slug) ? request.Name : request.Slug);

            var product = new Product
            {
                Category = category,
                Name = request.Name.Trim(),
                Slug = slug,
                Sku = request.Sku.Trim().ToUpperInvariant(),
                Summary = request.Summary.Trim(),
                Description = request.Description.Trim(),
                Price = request.Price,
                Currency = "GTQ",
                IsPublished = request.IsPublished,
                InventoryItem = new Modules.Inventory.Entities.InventoryItem
                {
                    StockOnHand = request.StockOnHand,
                    UpdatedAt = DateTimeOffset.UtcNow,
                },
                UpdatedAt = DateTimeOffset.UtcNow,
            };

            dbContext.Products.Add(product);

            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                return Results.Conflict(new { message = "A product with the same slug or SKU already exists." });
            }

            return Results.Created($"/api/v1/admin/catalog/products/{product.Id}", product.ToAdminSummary());
        })
        .WithName("CreateAdminProduct");

        adminGroup.MapPut("/products/{id:guid}", async (
            Guid id,
            UpsertProductRequest request,
            AppCommerceContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var validationError = ValidateUpsertRequest(request);
            if (validationError is not null)
            {
                return Results.ValidationProblem(validationError);
            }

            var product = await dbContext.Products
                .Include(existingProduct => existingProduct.Category)
                .Include(existingProduct => existingProduct.InventoryItem)
                .FirstOrDefaultAsync(existingProduct => existingProduct.Id == id, cancellationToken);

            if (product is null)
            {
                return Results.NotFound(new { message = "Product not found." });
            }

            product.Category = await GetOrCreateCategoryAsync(request.CategoryName, dbContext, cancellationToken);
            product.Name = request.Name.Trim();
            product.Slug = CommerceText.ToSlug(string.IsNullOrWhiteSpace(request.Slug) ? request.Name : request.Slug);
            product.Sku = request.Sku.Trim().ToUpperInvariant();
            product.Summary = request.Summary.Trim();
            product.Description = request.Description.Trim();
            product.Price = request.Price;
            product.IsPublished = request.IsPublished;
            product.UpdatedAt = DateTimeOffset.UtcNow;
            product.InventoryItem.StockOnHand = request.StockOnHand;
            product.InventoryItem.UpdatedAt = DateTimeOffset.UtcNow;

            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                return Results.Conflict(new { message = "A product with the same slug or SKU already exists." });
            }

            return Results.Ok(product.ToAdminSummary());
        })
        .WithName("UpdateAdminProduct");
    }

    private static async Task<Category> GetOrCreateCategoryAsync(
        string categoryName,
        AppCommerceContext dbContext,
        CancellationToken cancellationToken)
    {
        var trimmedName = categoryName.Trim();
        var slug = CommerceText.ToSlug(trimmedName);

        var existingCategory = await dbContext.Categories
            .FirstOrDefaultAsync(category => category.Slug == slug, cancellationToken);

        if (existingCategory is not null)
        {
            existingCategory.Name = trimmedName;
            return existingCategory;
        }

        var category = new Category
        {
            Name = trimmedName,
            Slug = slug,
        };

        dbContext.Categories.Add(category);
        return category;
    }

    private static Dictionary<string, string[]>? ValidateUpsertRequest(UpsertProductRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            errors["name"] = ["Name is required."];
        }

        if (string.IsNullOrWhiteSpace(request.Sku))
        {
            errors["sku"] = ["SKU is required."];
        }

        if (string.IsNullOrWhiteSpace(request.CategoryName))
        {
            errors["categoryName"] = ["Category name is required."];
        }

        if (string.IsNullOrWhiteSpace(request.Summary))
        {
            errors["summary"] = ["Summary is required."];
        }

        if (string.IsNullOrWhiteSpace(request.Description))
        {
            errors["description"] = ["Description is required."];
        }

        if (request.Price <= 0)
        {
            errors["price"] = ["Price must be greater than zero."];
        }

        if (request.StockOnHand < 0)
        {
            errors["stockOnHand"] = ["Stock cannot be negative."];
        }

        return errors.Count == 0 ? null : errors;
    }
}

public sealed record UpsertProductRequest(
    string Name,
    string? Slug,
    string Sku,
    string CategoryName,
    string Summary,
    string Description,
    decimal Price,
    bool IsPublished,
    int StockOnHand);

public sealed record PublicCatalogProductSummary(
    Guid Id,
    string Name,
    string Slug,
    string Summary,
    string CategoryName,
    decimal Price,
    string Currency,
    bool InStock,
    int StockOnHand,
    string? PrimaryImageUrl);

public sealed record PublicCatalogProductDetail(
    Guid Id,
    string Name,
    string Slug,
    string Sku,
    string Summary,
    string Description,
    string CategoryName,
    decimal Price,
    string Currency,
    bool InStock,
    int StockOnHand,
    IReadOnlyList<ProductImageDto> Images);

public sealed record AdminCatalogProductSummary(
    Guid Id,
    string Name,
    string Slug,
    string Sku,
    string CategoryName,
    string Summary,
    string Description,
    decimal Price,
    string Currency,
    bool IsPublished,
    int StockOnHand,
    DateTimeOffset UpdatedAt,
    int ImageCount,
    string? PrimaryImageUrl);

internal static class CatalogMappings
{
    public static PublicCatalogProductSummary ToPublicSummary(this Product product)
    {
        var primaryImage = product.Images?
            .FirstOrDefault(img => img.IsPrimary)
            ?? product.Images?.OrderBy(img => img.SortOrder).FirstOrDefault();

        return new PublicCatalogProductSummary(
            product.Id,
            product.Name,
            product.Slug,
            product.Summary,
            product.Category!.Name,
            product.Price,
            product.Currency,
            product.InventoryItem!.StockOnHand > 0,
            product.InventoryItem!.StockOnHand,
            primaryImage?.ImageUrl);
    }

    public static PublicCatalogProductDetail ToPublicDetail(this Product product)
    {
        var images = (product.Images ?? [])
            .OrderByDescending(img => img.IsPrimary)
            .ThenBy(img => img.SortOrder)
            .ThenBy(img => img.CreatedAt)
            .Select(img => new ProductImageDto(img.Id, img.ImageUrl, img.AltText, img.SortOrder, img.IsPrimary))
            .ToList();

        return new PublicCatalogProductDetail(
            product.Id,
            product.Name,
            product.Slug,
            product.Sku,
            product.Summary,
            product.Description,
            product.Category!.Name,
            product.Price,
            product.Currency,
            product.InventoryItem!.StockOnHand > 0,
            product.InventoryItem!.StockOnHand,
            images);
    }

    public static AdminCatalogProductSummary ToAdminSummary(this Product product)
    {
        var primaryImage = product.Images?
            .FirstOrDefault(img => img.IsPrimary)
            ?? product.Images?.OrderBy(img => img.SortOrder).FirstOrDefault();

        return new AdminCatalogProductSummary(
            product.Id,
            product.Name,
            product.Slug,
            product.Sku,
            product.Category!.Name,
            product.Summary,
            product.Description,
            product.Price,
            product.Currency,
            product.IsPublished,
            product.InventoryItem!.StockOnHand,
            product.UpdatedAt,
            product.Images?.Count ?? 0,
            primaryImage?.ImageUrl);
    }
}
