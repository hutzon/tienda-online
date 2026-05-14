using Microsoft.EntityFrameworkCore;
using TiendaOnline.Api.Auth;
using TiendaOnline.Api.Modules.Catalog.Entities;
using TiendaOnline.Api.Modules.Commerce;

namespace TiendaOnline.Api.Modules.Catalog;

public static class CategoryEndpoints
{
    public static void MapCategoryEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Public ────────────────────────────────────────────────────────────
        var publicGroup = app.MapGroup("/api/v1/catalog/categories").WithTags("Catalog Categories");

        publicGroup.MapGet("/", async (AppCommerceContext db) =>
        {
            var categories = await db.Categories
                .AsNoTracking()
                .OrderBy(c => c.Name)
                .Select(c => new CategoryDto(c.Id, c.Name, c.Slug))
                .ToListAsync();

            return Results.Ok(categories);
        })
        .WithName("GetPublicCategories");

        // ── Admin ─────────────────────────────────────────────────────────────
        var adminGroup = app.MapGroup("/api/v1/admin/catalog/categories")
            .WithTags("Admin Catalog Categories")
            .RequireAuthorization(AppPolicies.RequireAdmin);

        adminGroup.MapGet("/", async (AppCommerceContext db) =>
        {
            var categories = await db.Categories
                .AsNoTracking()
                .OrderBy(c => c.Name)
                .Select(c => new CategoryDto(c.Id, c.Name, c.Slug))
                .ToListAsync();

            return Results.Ok(categories);
        })
        .WithName("GetAdminCategories");

        adminGroup.MapPost("/", async (
            UpsertCategoryRequest request,
            AppCommerceContext db,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["Name is required."] });

            var slug = CommerceText.ToSlug(request.Name);
            if (await db.Categories.AnyAsync(c => c.Slug == slug, cancellationToken))
                return Results.Conflict(new { message = "A category with this name already exists." });

            var category = new Category { Name = request.Name.Trim(), Slug = slug };
            db.Categories.Add(category);
            await db.SaveChangesAsync(cancellationToken);

            return Results.Created($"/api/v1/admin/catalog/categories/{category.Id}", new CategoryDto(category.Id, category.Name, category.Slug));
        })
        .WithName("CreateAdminCategory");

        adminGroup.MapPut("/{id:guid}", async (
            Guid id,
            UpsertCategoryRequest request,
            AppCommerceContext db,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["Name is required."] });

            var category = await db.Categories.FindAsync([id], cancellationToken);
            if (category is null) return Results.NotFound(new { message = "Category not found." });

            var slug = CommerceText.ToSlug(request.Name);
            if (await db.Categories.AnyAsync(c => c.Slug == slug && c.Id != id, cancellationToken))
                return Results.Conflict(new { message = "Another category with this name already exists." });

            category.Name = request.Name.Trim();
            category.Slug = slug;
            await db.SaveChangesAsync(cancellationToken);

            return Results.Ok(new CategoryDto(category.Id, category.Name, category.Slug));
        })
        .WithName("UpdateAdminCategory");

        adminGroup.MapDelete("/{id:guid}", async (
            Guid id,
            AppCommerceContext db,
            CancellationToken cancellationToken) =>
        {
            var category = await db.Categories
                .Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

            if (category is null) return Results.NotFound(new { message = "Category not found." });

            if (category.Products?.Count > 0)
                return Results.Conflict(new { message = "Cannot delete a category that has products assigned to it." });

            db.Categories.Remove(category);
            await db.SaveChangesAsync(cancellationToken);

            return Results.Ok(new { deleted = true });
        })
        .WithName("DeleteAdminCategory");
    }
}

public sealed record CategoryDto(Guid Id, string Name, string Slug);
public sealed record UpsertCategoryRequest(string Name);
