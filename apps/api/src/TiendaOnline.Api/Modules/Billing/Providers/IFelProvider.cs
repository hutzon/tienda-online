namespace TiendaOnline.Api.Modules.Billing.Providers;

public sealed record FelResponse(
    bool Success,
    string? Uuid,
    string? Signature,
    string? Status,
    string? RawResponse,
    string? ErrorMessage
);

public interface IFelProvider
{
    Task<FelResponse> EmitInvoiceAsync(Entities.Invoice invoice, CancellationToken cancellationToken);
}
