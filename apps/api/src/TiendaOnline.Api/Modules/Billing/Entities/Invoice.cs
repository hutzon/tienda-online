using TiendaOnline.Api.Modules.Orders.Entities;

namespace TiendaOnline.Api.Modules.Billing.Entities;

public sealed class Invoice
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OrderId { get; set; }

    public Order? Order { get; set; }

    public string? Uuid { get; set; }

    public string? SatSignature { get; set; }

    public string Status { get; set; } = string.Empty;

    public decimal Subtotal { get; set; }

    public decimal TaxAmount { get; set; }

    public decimal Total { get; set; }

    public string? PayloadSent { get; set; }

    public string? ProviderResponse { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? EmittedAt { get; set; }

    public ICollection<InvoiceLine> Lines { get; set; } = new List<InvoiceLine>();
}
