using Microsoft.EntityFrameworkCore;
using TiendaOnline.Api.Auth;
using TiendaOnline.Api.Modules.Catalog.Entities;
using TiendaOnline.Api.Modules.Commerce;

namespace TiendaOnline.Api.Modules.Catalog;

public static class ImageEndpoints
{
    private static readonly HashSet<string> AllowedExtensions =
        new(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp" };

    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    public static void MapImageEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Public: list images for a published product ──────────────────────
        var publicGroup = app.MapGroup("/api/v1/catalog/products/{productId:guid}")
            .WithTags("Catalog Images");

        publicGroup.MapGet("/images", async (Guid productId, AppCommerceContext db) =>
        {
            var exists = await db.Products
                .AsNoTracking()
                .AnyAsync(p => p.Id == productId && p.IsPublished);

            if (!exists) return Results.NotFound(new { message = "Product not found." });

            var images = await db.ProductImages
                .AsNoTracking()
                .Where(img => img.ProductId == productId)
                .OrderByDescending(img => img.IsPrimary)
                .ThenBy(img => img.SortOrder)
                .ThenBy(img => img.CreatedAt)
                .Select(img => new ProductImageDto(img.Id, img.ImageUrl, img.AltText, img.SortOrder, img.IsPrimary))
                .ToListAsync();

            return Results.Ok(images);
        })
        .WithName("GetPublicProductImages");

        // ── Admin: full CRUD for product images ──────────────────────────────
        var adminGroup = app.MapGroup("/api/v1/admin/catalog/products/{productId:guid}")
            .WithTags("Admin Catalog Images")
            .RequireAuthorization(AppPolicies.RequireAdmin);

        adminGroup.MapGet("/images", async (Guid productId, AppCommerceContext db) =>
        {
            var exists = await db.Products.AnyAsync(p => p.Id == productId);
            if (!exists) return Results.NotFound(new { message = "Product not found." });

            var images = await db.ProductImages
                .AsNoTracking()
                .Where(img => img.ProductId == productId)
                .OrderByDescending(img => img.IsPrimary)
                .ThenBy(img => img.SortOrder)
                .ThenBy(img => img.CreatedAt)
                .Select(img => new ProductImageDto(img.Id, img.ImageUrl, img.AltText, img.SortOrder, img.IsPrimary))
                .ToListAsync();

            return Results.Ok(images);
        })
        .WithName("GetAdminProductImages");

        adminGroup.MapPost("/images", async (
            Guid productId,
            IFormFile file,
            HttpContext httpContext,
            AppCommerceContext db,
            IWebHostEnvironment env,
            CancellationToken cancellationToken) =>
        {
            var product = await db.Products.FindAsync([productId], cancellationToken);
            if (product is null)
                return Results.NotFound(new { message = "Product not found." });

            if (file is null || file.Length == 0)
                return Results.BadRequest(new { message = "No file provided." });

            if (file.Length > MaxFileSizeBytes)
                return Results.BadRequest(new { message = "File exceeds the 5 MB limit." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(ext))
                return Results.BadRequest(new { message = "Invalid file type. Allowed: jpg, jpeg, png, webp." });

            var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
            var uploadsDir = Path.Combine(webRoot, "uploads", "products");
            Directory.CreateDirectory(uploadsDir);

            var fileName = $"{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(uploadsDir, fileName);

            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            // Construct accessible URL from the request context.
            var req = httpContext.Request;
            var imageUrl = $"{req.Scheme}://{req.Host}/uploads/products/{fileName}";

            var isPrimary = !await db.ProductImages
                .AnyAsync(img => img.ProductId == productId, cancellationToken);

            var sortOrder = await db.ProductImages
                .CountAsync(img => img.ProductId == productId, cancellationToken);

            var altText = string.IsNullOrWhiteSpace(file.FileName)
                ? product.Name
                : Path.GetFileNameWithoutExtension(file.FileName);

            var productImage = new ProductImage
            {
                ProductId = productId,
                ImageUrl = imageUrl,
                AltText = altText,
                SortOrder = sortOrder,
                IsPrimary = isPrimary,
            };

            db.ProductImages.Add(productImage);
            await db.SaveChangesAsync(cancellationToken);

            return Results.Created(
                $"/api/v1/admin/catalog/products/{productId}/images/{productImage.Id}",
                new ProductImageDto(
                    productImage.Id,
                    productImage.ImageUrl,
                    productImage.AltText,
                    productImage.SortOrder,
                    productImage.IsPrimary));
        })
        .WithName("UploadProductImage")
        .DisableAntiforgery();

        adminGroup.MapPut("/images/{imageId:guid}/primary", async (
            Guid productId,
            Guid imageId,
            AppCommerceContext db,
            CancellationToken cancellationToken) =>
        {
            var image = await db.ProductImages
                .FirstOrDefaultAsync(
                    img => img.Id == imageId && img.ProductId == productId,
                    cancellationToken);

            if (image is null)
                return Results.NotFound(new { message = "Image not found." });

            var currentPrimaries = await db.ProductImages
                .Where(img => img.ProductId == productId && img.IsPrimary)
                .ToListAsync(cancellationToken);

            foreach (var img in currentPrimaries)
                img.IsPrimary = false;

            image.IsPrimary = true;
            await db.SaveChangesAsync(cancellationToken);

            return Results.Ok(new ProductImageDto(
                image.Id, image.ImageUrl, image.AltText, image.SortOrder, image.IsPrimary));
        })
        .WithName("SetPrimaryProductImage");

        adminGroup.MapDelete("/images/{imageId:guid}", async (
            Guid productId,
            Guid imageId,
            AppCommerceContext db,
            IWebHostEnvironment env,
            CancellationToken cancellationToken) =>
        {
            var image = await db.ProductImages
                .FirstOrDefaultAsync(
                    img => img.Id == imageId && img.ProductId == productId,
                    cancellationToken);

            if (image is null)
                return Results.NotFound(new { message = "Image not found." });

            // Best-effort file deletion — URL contains the host, extract just the path.
            try
            {
                var uri = new Uri(image.ImageUrl);
                var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
                var filePath = Path.Combine(webRoot, uri.AbsolutePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (File.Exists(filePath)) File.Delete(filePath);
            }
            catch
            {
                // Non-critical: log loss acceptable for dev-only local storage.
            }

            var wasPrimary = image.IsPrimary;
            db.ProductImages.Remove(image);
            await db.SaveChangesAsync(cancellationToken);

            if (wasPrimary)
            {
                var next = await db.ProductImages
                    .Where(img => img.ProductId == productId)
                    .OrderBy(img => img.SortOrder)
                    .ThenBy(img => img.CreatedAt)
                    .FirstOrDefaultAsync(cancellationToken);

                if (next is not null)
                {
                    next.IsPrimary = true;
                    await db.SaveChangesAsync(cancellationToken);
                }
            }

            return Results.Ok(new { deleted = true });
        })
        .WithName("DeleteProductImage");
    }
}

public sealed record ProductImageDto(
    Guid Id,
    string ImageUrl,
    string AltText,
    int SortOrder,
    bool IsPrimary);
