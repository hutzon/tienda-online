using TiendaOnline.Api.Modules.Inventory.Entities;
using TiendaOnline.Api.Modules.Orders.Entities;

namespace TiendaOnline.Api.Modules.Catalog.Entities;

public sealed class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CategoryId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string Sku { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public string Currency { get; set; } = "GTQ";

    public bool IsPublished { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Category? Category { get; set; }

    public InventoryItem? InventoryItem { get; set; }

    public List<OrderItem>? OrderItems { get; set; }
}
