using Microsoft.EntityFrameworkCore;
using TiendaOnline.Api.Auth;
using TiendaOnline.Api.Modules.Billing.Entities;
using TiendaOnline.Api.Modules.Billing.Providers;
using TiendaOnline.Api.Modules.Commerce;

namespace TiendaOnline.Api.Modules.Billing;

public static class BillingEndpoints
{
    public static void MapBillingEndpoints(this IEndpointRouteBuilder app)
    {
        var adminGroup = app.MapGroup("/api/v1/admin/orders/{orderId:guid}/invoices")
            .WithTags("Billing")
            .RequireAuthorization(AppPolicies.RequireAdmin);

        adminGroup.MapPost("/", async (
            Guid orderId,
            AppCommerceContext dbContext,
            IFelProvider felProvider,
            CancellationToken cancellationToken) =>
        {
            var order = await dbContext.Orders
                .Include(o => o.Items)
                .Include(o => o.Invoices)
                .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

            if (order is null) return Results.NotFound(new { message = "Order not found." });

            if (order.Status != OrderStatuses.Confirmed)
            {
                return Results.BadRequest(new { message = $"Cannot emit invoice for order in status {order.Status}." });
            }

            if (order.Invoices?.Any(i => i.Status == InvoiceStatuses.Emitted) == true)
            {
                return Results.BadRequest(new { message = "An invoice has already been emitted for this order." });
            }

            var taxRate = 0.12m;
            var taxAmount = order.Subtotal * taxRate;
            
            var invoice = new Invoice
            {
                OrderId = order.Id,
                Status = InvoiceStatuses.Draft,
                Subtotal = order.Subtotal,
                TaxAmount = taxAmount,
                Total = order.Total,
                PayloadSent = $"<dte><mock>Factura para orden {order.OrderNumber}</mock><total>{order.Total}</total></dte>"
            };

            foreach (var item in order.Items)
            {
                invoice.Lines.Add(new InvoiceLine
                {
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    Sku = item.Sku,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    LineTotal = item.LineTotal
                });
            }

            dbContext.Invoices.Add(invoice);

            var felResponse = await felProvider.EmitInvoiceAsync(invoice, cancellationToken);
            invoice.ProviderResponse = felResponse.RawResponse;

            if (felResponse.Success)
            {
                invoice.Status = InvoiceStatuses.Emitted;
                invoice.Uuid = felResponse.Uuid;
                invoice.SatSignature = felResponse.Signature;
                invoice.EmittedAt = DateTimeOffset.UtcNow;
            }
            else
            {
                invoice.Status = InvoiceStatuses.Error;
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            return felResponse.Success 
                ? Results.Ok(invoice.ToResponse()) 
                : Results.BadRequest(new { message = "Failed to emit invoice with FEL provider.", details = felResponse.ErrorMessage, rawResponse = felResponse.RawResponse });
        })
        .WithName("EmitInvoice");

        var publicGroup = app.MapGroup("/api/v1/orders/{orderId:guid}/invoices")
            .WithTags("Billing");

        publicGroup.MapGet("/", async (
            Guid orderId,
            AppCommerceContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var invoices = await dbContext.Invoices
                .AsNoTracking()
                .Include(i => i.Lines)
                .Where(i => i.OrderId == orderId)
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => i.ToResponse())
                .ToListAsync(cancellationToken);

            return Results.Ok(invoices);
        })
        .WithName("GetOrderInvoices");
    }
}

public sealed record InvoiceResponse(
    Guid Id,
    Guid OrderId,
    string? Uuid,
    string? SatSignature,
    string Status,
    decimal Subtotal,
    decimal TaxAmount,
    decimal Total,
    DateTimeOffset CreatedAt,
    DateTimeOffset? EmittedAt,
    List<InvoiceLineResponse> Lines
);

public sealed record InvoiceLineResponse(
    Guid ProductId,
    string ProductName,
    string Sku,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal
);

internal static class BillingMappings
{
    public static InvoiceResponse ToResponse(this Invoice invoice)
    {
        return new InvoiceResponse(
            invoice.Id,
            invoice.OrderId,
            invoice.Uuid,
            invoice.SatSignature,
            invoice.Status,
            invoice.Subtotal,
            invoice.TaxAmount,
            invoice.Total,
            invoice.CreatedAt,
            invoice.EmittedAt,
            invoice.Lines.Select(l => new InvoiceLineResponse(
                l.ProductId,
                l.ProductName,
                l.Sku,
                l.Quantity,
                l.UnitPrice,
                l.LineTotal
            )).ToList()
        );
    }
}
