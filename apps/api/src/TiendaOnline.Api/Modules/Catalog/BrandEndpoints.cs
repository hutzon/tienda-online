using Microsoft.EntityFrameworkCore;
using TiendaOnline.Api.Auth;
using TiendaOnline.Api.Modules.Catalog.Entities;
using TiendaOnline.Api.Modules.Commerce;

namespace TiendaOnline.Api.Modules.Catalog;

public static class BrandEndpoints
{
    public static void MapBrandEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Public ────────────────────────────────────────────────────────────
        var publicGroup = app.MapGroup("/api/v1/catalog/brands").WithTags("Catalog Brands");

        publicGroup.MapGet("/", async (AppCommerceContext db) =>
        {
            var brands = await db.Brands
                .AsNoTracking()
                .OrderBy(b => b.Name)
                .Select(b => new BrandDto(b.Id, b.Name, b.Slug, b.Description))
                .ToListAsync();

            return Results.Ok(brands);
        })
        .WithName("GetPublicBrands");

        // ── Admin ─────────────────────────────────────────────────────────────
        var adminGroup = app.MapGroup("/api/v1/admin/catalog/brands")
            .WithTags("Admin Catalog Brands")
            .RequireAuthorization(AppPolicies.RequireAdmin);

        adminGroup.MapGet("/", async (AppCommerceContext db) =>
        {
            var brands = await db.Brands
                .AsNoTracking()
                .OrderBy(b => b.Name)
                .Select(b => new BrandDto(b.Id, b.Name, b.Slug, b.Description))
                .ToListAsync();

            return Results.Ok(brands);
        })
        .WithName("GetAdminBrands");

        adminGroup.MapPost("/", async (
            UpsertBrandRequest request,
            AppCommerceContext db,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["Name is required."] });

            var slug = CommerceText.ToSlug(request.Name);
            if (await db.Brands.AnyAsync(b => b.Slug == slug, cancellationToken))
                return Results.Conflict(new { message = "A brand with this name already exists." });

            var brand = new Brand
            {
                Name = request.Name.Trim(),
                Slug = slug,
                Description = request.Description?.Trim(),
            };

            db.Brands.Add(brand);
            await db.SaveChangesAsync(cancellationToken);

            return Results.Created(
                $"/api/v1/admin/catalog/brands/{brand.Id}",
                new BrandDto(brand.Id, brand.Name, brand.Slug, brand.Description));
        })
        .WithName("CreateAdminBrand");

        adminGroup.MapPut("/{id:guid}", async (
            Guid id,
            UpsertBrandRequest request,
            AppCommerceContext db,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["Name is required."] });

            var brand = await db.Brands.FindAsync([id], cancellationToken);
            if (brand is null) return Results.NotFound(new { message = "Brand not found." });

            var slug = CommerceText.ToSlug(request.Name);
            if (await db.Brands.AnyAsync(b => b.Slug == slug && b.Id != id, cancellationToken))
                return Results.Conflict(new { message = "Another brand with this name already exists." });

            brand.Name = request.Name.Trim();
            brand.Slug = slug;
            brand.Description = request.Description?.Trim();
            await db.SaveChangesAsync(cancellationToken);

            return Results.Ok(new BrandDto(brand.Id, brand.Name, brand.Slug, brand.Description));
        })
        .WithName("UpdateAdminBrand");

        adminGroup.MapDelete("/{id:guid}", async (
            Guid id,
            AppCommerceContext db,
            CancellationToken cancellationToken) =>
        {
            var brand = await db.Brands
                .Include(b => b.Products)
                .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

            if (brand is null) return Results.NotFound(new { message = "Brand not found." });

            if (brand.Products?.Count > 0)
                return Results.Conflict(new { message = "Cannot delete a brand that has products assigned to it." });

            db.Brands.Remove(brand);
            await db.SaveChangesAsync(cancellationToken);

            return Results.Ok(new { deleted = true });
        })
        .WithName("DeleteAdminBrand");
    }
}

public sealed record BrandDto(Guid Id, string Name, string Slug, string? Description);
public sealed record UpsertBrandRequest(string Name, string? Description);
