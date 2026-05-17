namespace TiendaOnline.Api.Modules.Orders.Entities;

public sealed class OrderTrackingEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OrderId { get; set; }

    public string Status { get; set; } = string.Empty;

    public string? Comment { get; set; }

    public string? CreatedBy { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Order Order { get; set; } = null!;
}
