using TiendaOnline.Api.Modules.Orders.Entities;

namespace TiendaOnline.Api.Modules.Payments.Entities;

public sealed class PaymentAttempt
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OrderId { get; set; }

    public decimal Amount { get; set; }

    public string Currency { get; set; } = "GTQ";

    public string PaymentMethod { get; set; } = string.Empty;

    public string Status { get; set; } = Commerce.PaymentStatuses.Pending;

    public string? ProviderTransactionId { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Order? Order { get; set; }
}
