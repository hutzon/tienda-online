using TiendaOnline.Api.Modules.Orders.Entities;

namespace TiendaOnline.Api.Modules.Checkout.Entities;

public sealed class CheckoutSession
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OrderId { get; set; }

    public string Status { get; set; } = Commerce.CheckoutSessionStatuses.Active;

    public DateTimeOffset ExpiresAt { get; set; } = DateTimeOffset.UtcNow.AddHours(2);

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Order? Order { get; set; }
}
