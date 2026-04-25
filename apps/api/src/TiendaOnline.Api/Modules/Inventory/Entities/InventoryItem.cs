using TiendaOnline.Api.Modules.Catalog.Entities;

namespace TiendaOnline.Api.Modules.Inventory.Entities;

public sealed class InventoryItem
{
    public Guid ProductId { get; set; }

    public int StockOnHand { get; set; }

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Product? Product { get; set; }
}
