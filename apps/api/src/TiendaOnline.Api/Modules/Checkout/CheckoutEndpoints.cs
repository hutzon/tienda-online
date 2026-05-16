using Microsoft.EntityFrameworkCore;
using TiendaOnline.Api.Modules.Checkout.Entities;
using TiendaOnline.Api.Modules.Commerce;
using TiendaOnline.Api.Modules.Orders.Entities;
using TiendaOnline.Api.Modules.Payments.Entities;
using TiendaOnline.Api.Modules.Orders;

namespace TiendaOnline.Api.Modules.Checkout;

public static class CheckoutEndpoints
{
    public static void MapCheckoutEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/checkout/sessions")
            .WithTags("Checkout");

        group.MapPost("/", async (
            CreateCheckoutSessionRequest request,
            AppCommerceContext dbContext,
            CancellationToken cancellationToken) =>
        {
            if (request.Items.Count == 0)
            {
                return Results.BadRequest(new { message = "Cart is empty." });
            }

            if (request.Items.Any(item => item.Quantity <= 0))
            {
                return Results.BadRequest(new { message = "Each item quantity must be greater than zero." });
            }

            var productIds = request.Items.Select(item => item.ProductId).Distinct().ToList();
            var products = await dbContext.Products
                .AsNoTracking()
                .Include(p => p.InventoryItem)
                .Where(p => p.IsPublished && productIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, cancellationToken);

            if (products.Count != productIds.Count)
            {
                return Results.BadRequest(new { message = "Some products are not available." });
            }

            foreach (var item in request.Items)
            {
                var product = products[item.ProductId];
                if (product.InventoryItem.StockOnHand < item.Quantity)
                {
                    return Results.BadRequest(new { message = $"Insufficient stock for {product.Name}." });
                }
            }

            var orderItems = request.Items.Select(item =>
            {
                var product = products[item.ProductId];
                return new OrderItem
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    ProductSlug = product.Slug,
                    Sku = product.Sku,
                    Quantity = item.Quantity,
                    UnitPrice = product.Price,
                    LineTotal = product.Price * item.Quantity,
                };
            }).ToList();

            var subtotal = orderItems.Sum(item => item.LineTotal);
            var order = new Order
            {
                OrderNumber = CommerceText.GenerateOrderNumber(),
                Status = OrderStatuses.Draft,
                Subtotal = subtotal,
                Total = subtotal,
                Items = orderItems,
            };

            var session = new CheckoutSession
            {
                Order = order,
            };

            dbContext.Orders.Add(order);
            dbContext.CheckoutSessions.Add(session);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new CheckoutSessionResponse(session.Id, order.Id, session.Status, session.ExpiresAt));
        })
        .WithName("CreateCheckoutSession");

        group.MapGet("/{id:guid}", async (Guid id, AppCommerceContext dbContext) =>
        {
            var session = await dbContext.CheckoutSessions
                .AsNoTracking()
                .Include(s => s.Order!)
                .ThenInclude(o => o.Items)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (session is null) return Results.NotFound();

            return Results.Ok(new CheckoutSessionDetailResponse(
                session.Id,
                session.Status,
                session.ExpiresAt,
                session.Order!.ToResponse()
            ));
        })
        .WithName("GetCheckoutSession");

        group.MapPut("/{id:guid}/customer", async (
            Guid id,
            UpdateCustomerRequest request,
            AppCommerceContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var session = await dbContext.CheckoutSessions
                .Include(s => s.Order)
                .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

            if (session is null) return Results.NotFound();
            if (session.Status != CheckoutSessionStatuses.Active)
                return Results.BadRequest(new { message = "Session is no longer active." });

            var customerErrors = ValidateCustomerRequest(request);
            if (customerErrors is not null)
                return Results.ValidationProblem(customerErrors);

            var order = session.Order!;
            order.CustomerName = request.CustomerName.Trim();
            order.CustomerEmail = request.CustomerEmail.Trim().ToLowerInvariant();
            order.Phone = request.Phone.Trim();
            order.Address = request.Address.Trim();

            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new { updated = true });
        })
        .WithName("UpdateCheckoutCustomer");

        group.MapPost("/{id:guid}/payment-method", async (
            Guid id,
            SelectPaymentMethodRequest request,
            AppCommerceContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var session = await dbContext.CheckoutSessions
                .Include(s => s.Order)
                .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

            if (session is null) return Results.NotFound();
            if (session.Status != CheckoutSessionStatuses.Active)
                return Results.BadRequest(new { message = "Session is no longer active." });

            var order = session.Order!;

            if (string.IsNullOrWhiteSpace(order.CustomerName) || string.IsNullOrWhiteSpace(order.Address))
            {
                return Results.BadRequest(new { message = "Customer details are missing." });
            }

            var paymentAttempt = new PaymentAttempt
            {
                OrderId = order.Id,
                Amount = order.Total,
                Currency = order.Currency,
                PaymentMethod = request.PaymentMethod,
                Status = PaymentStatuses.Pending
            };

            if (request.PaymentMethod == PaymentMethods.CashOnDelivery)
            {
                order.Status = OrderStatuses.Confirmed;
                session.Status = CheckoutSessionStatuses.Completed;
            }
            else if (request.PaymentMethod == PaymentMethods.OnlineSimulated)
            {
                order.Status = OrderStatuses.PendingPayment;
                // Session stays active until payment is completed
            }
            else
            {
                return Results.BadRequest(new { message = "Invalid payment method." });
            }

            dbContext.PaymentAttempts.Add(paymentAttempt);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new { PaymentAttemptId = paymentAttempt.Id, OrderStatus = order.Status });
        })
        .WithName("SelectPaymentMethod");
    }

    private static Dictionary<string, string[]>? ValidateCustomerRequest(UpdateCustomerRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.CustomerName))
            errors["customerName"] = ["Customer name is required."];

        if (string.IsNullOrWhiteSpace(request.CustomerEmail)
            || !request.CustomerEmail.Contains('@')
            || request.CustomerEmail.Length > 254)
            errors["customerEmail"] = ["A valid customer email is required (max 254 chars)."];

        if (string.IsNullOrWhiteSpace(request.Phone))
            errors["phone"] = ["Phone is required."];

        if (string.IsNullOrWhiteSpace(request.Address))
            errors["address"] = ["Address is required."];

        return errors.Count == 0 ? null : errors;
    }
}

public sealed record CreateCheckoutSessionRequest(List<CreateOrderItemRequest> Items);
public sealed record CheckoutSessionResponse(Guid Id, Guid OrderId, string Status, DateTimeOffset ExpiresAt);
public sealed record CheckoutSessionDetailResponse(Guid Id, string Status, DateTimeOffset ExpiresAt, OrderResponse Order);
public sealed record UpdateCustomerRequest(string CustomerName, string CustomerEmail, string Phone, string Address);
public sealed record SelectPaymentMethodRequest(string PaymentMethod);
