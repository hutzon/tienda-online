using TiendaOnline.Api.Modules.Payments.Entities;

namespace TiendaOnline.Api.Modules.Orders.Entities;

public sealed class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string OrderNumber { get; set; } = string.Empty;

    public string Status { get; set; } = TiendaOnline.Api.Modules.Commerce.OrderStatuses.Draft;

    public string CustomerName { get; set; } = string.Empty;

    public string CustomerEmail { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string Currency { get; set; } = "GTQ";

    public decimal Subtotal { get; set; }

    public decimal Total { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<OrderItem> Items { get; set; } = [];

    public List<PaymentAttempt>? PaymentAttempts { get; set; }
}
