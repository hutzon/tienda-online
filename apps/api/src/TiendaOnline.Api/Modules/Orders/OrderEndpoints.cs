using Microsoft.EntityFrameworkCore;
using TiendaOnline.Api.Auth;
using TiendaOnline.Api.Modules.Commerce;
using TiendaOnline.Api.Modules.Orders.Entities;

namespace TiendaOnline.Api.Modules.Orders;

public static class OrderEndpoints
{
    public static void MapOrderEndpoints(this IEndpointRouteBuilder app)
    {
        var publicGroup = app.MapGroup("/api/v1/orders")
            .WithTags("Orders");

        publicGroup.MapPost("/", async (
            CreateOrderRequest request,
            AppCommerceContext dbContext,
            ILoggerFactory loggerFactory,
            CancellationToken cancellationToken) =>
        {
            var validationErrors = ValidateOrderRequest(request);
            if (validationErrors is not null)
            {
                return Results.ValidationProblem(validationErrors);
            }

            var productIds = request.Items.Select(item => item.ProductId).Distinct().ToList();
            var products = await dbContext.Products
                .AsNoTracking()
                .Include(product => product.InventoryItem)
                .Where(product => product.IsPublished && productIds.Contains(product.Id))
                .ToDictionaryAsync(product => product.Id, cancellationToken);

            if (products.Count != productIds.Count)
            {
                return Results.BadRequest(new { message = "One or more requested products are not available." });
            }

            foreach (var item in request.Items)
            {
                var product = products[item.ProductId];
                if (product.InventoryItem.StockOnHand < item.Quantity)
                {
                    return Results.BadRequest(new
                    {
                        message = $"Insufficient stock for {product.Name}.",
                        productId = product.Id,
                        availableQuantity = product.InventoryItem.StockOnHand
                    });
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
                Status = "Draft",
                CustomerName = request.CustomerName.Trim(),
                CustomerEmail = request.CustomerEmail.Trim(),
                Currency = "GTQ",
                Subtotal = subtotal,
                Total = subtotal,
                Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
                Items = orderItems,
            };

            dbContext.Orders.Add(order);
            await dbContext.SaveChangesAsync(cancellationToken);

            var logger = loggerFactory.CreateLogger("OrderEndpoints");
            logger.LogInformation("Order created successfully. OrderId={OrderId}, OrderNumber={OrderNumber}, Total={Total}",
                order.Id, order.OrderNumber, order.Total);

            return Results.Created($"/api/v1/orders/{order.Id}", order.ToResponse());
        })
        .WithName("CreateOrder");

        publicGroup.MapGet("/track", async (string number, AppCommerceContext dbContext) =>
        {
            if (string.IsNullOrWhiteSpace(number))
                return Results.BadRequest(new { message = "Order number is required." });

            var order = await dbContext.Orders
                .AsNoTracking()
                .Include(o => o.Items)
                .Include(o => o.PaymentAttempts)
                .Include(o => o.TrackingEvents)
                .FirstOrDefaultAsync(o => o.OrderNumber == number.Trim().ToUpperInvariant());

            if (order is null || order.Status == OrderStatuses.Draft)
                return Results.NotFound(new { message = "Pedido no encontrado." });

            var lastPayment = order.PaymentAttempts?
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefault();

            var events = order.TrackingEvents
                .OrderBy(e => e.CreatedAt)
                .Select(e => new OrderTrackingEventResponse(e.Id, e.Status, e.Comment, e.CreatedBy, e.CreatedAt))
                .ToList();

            return Results.Ok(new OrderTrackingResponse(
                order.OrderNumber,
                order.Status,
                order.Currency,
                order.Total,
                order.CreatedAt,
                lastPayment?.PaymentMethod,
                lastPayment?.Status,
                order.Items.Select(i => new OrderTrackingItemResponse(
                    i.ProductName, i.Quantity, i.UnitPrice, i.LineTotal)).ToList(),
                events
            ));
        })
        .WithName("TrackOrder");

        var adminGroup = app.MapGroup("/api/v1/admin/orders")
            .WithTags("Admin Orders")
            .RequireAuthorization(AppPolicies.RequireAdmin);

        adminGroup.MapGet("/", async (AppCommerceContext dbContext) =>
        {
            var orders = await dbContext.Orders
                .AsNoTracking()
                .Include(order => order.Items)
                .Include(order => order.PaymentAttempts)
                .Include(order => order.Invoices)
                .Where(order => order.Status != OrderStatuses.Draft)
                .OrderByDescending(order => order.CreatedAt)
                .Select(order => order.ToResponse())
                .ToListAsync();

            return Results.Ok(orders);
        })
        .WithName("GetAdminOrders");

        adminGroup.MapGet("/{id:guid}/tracking", async (Guid id, AppCommerceContext dbContext) =>
        {
            var exists = await dbContext.Orders.AsNoTracking().AnyAsync(o => o.Id == id);
            if (!exists) return Results.NotFound();

            var events = await dbContext.OrderTrackingEvents
                .AsNoTracking()
                .Where(e => e.OrderId == id)
                .OrderByDescending(e => e.CreatedAt)
                .Select(e => new OrderTrackingEventResponse(e.Id, e.Status, e.Comment, e.CreatedBy, e.CreatedAt))
                .ToListAsync();

            return Results.Ok(events);
        })
        .WithName("GetOrderTracking");

        adminGroup.MapPost("/{id:guid}/tracking", async (Guid id, AddTrackingEventRequest request, AppCommerceContext dbContext) =>
        {
            if (string.IsNullOrWhiteSpace(request.Status))
                return Results.BadRequest(new { message = "Status is required." });

            var exists = await dbContext.Orders.AsNoTracking().AnyAsync(o => o.Id == id);
            if (!exists) return Results.NotFound();

            var trackingEvent = new OrderTrackingEvent
            {
                OrderId = id,
                Status = request.Status.Trim(),
                Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim(),
                CreatedBy = string.IsNullOrWhiteSpace(request.CreatedBy) ? null : request.CreatedBy.Trim(),
                CreatedAt = DateTimeOffset.UtcNow,
            };

            dbContext.OrderTrackingEvents.Add(trackingEvent);
            await dbContext.SaveChangesAsync();

            return Results.Created(
                $"/api/v1/admin/orders/{id}/tracking/{trackingEvent.Id}",
                new OrderTrackingEventResponse(trackingEvent.Id, trackingEvent.Status, trackingEvent.Comment, trackingEvent.CreatedBy, trackingEvent.CreatedAt));
        })
        .WithName("AddOrderTrackingEvent");
    }

    private static Dictionary<string, string[]>? ValidateOrderRequest(CreateOrderRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.CustomerName))
        {
            errors["customerName"] = ["Customer name is required."];
        }

        if (string.IsNullOrWhiteSpace(request.CustomerEmail) || !request.CustomerEmail.Contains('@') || request.CustomerEmail.Length > 254)
        {
            errors["customerEmail"] = ["A valid customer email is required (max 254 chars)."];
        }

        if (request.Items.Count == 0)
        {
            errors["items"] = ["At least one order item is required."];
        }

        if (request.Items.Any(item => item.Quantity <= 0))
        {
            errors["items.quantity"] = ["Each item quantity must be greater than zero."];
        }

        return errors.Count == 0 ? null : errors;
    }
}

public sealed record CreateOrderRequest(
    string CustomerName,
    string CustomerEmail,
    string? Notes,
    List<CreateOrderItemRequest> Items);

public sealed record OrderTrackingEventResponse(
    Guid Id,
    string Status,
    string? Comment,
    string? CreatedBy,
    DateTimeOffset CreatedAt);

public sealed record AddTrackingEventRequest(
    string Status,
    string? Comment,
    string? CreatedBy);

public sealed record OrderTrackingResponse(
    string OrderNumber,
    string Status,
    string Currency,
    decimal Total,
    DateTimeOffset CreatedAt,
    string? PaymentMethod,
    string? PaymentStatus,
    List<OrderTrackingItemResponse> Items,
    List<OrderTrackingEventResponse> Events);

public sealed record OrderTrackingItemResponse(
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal);

public sealed record CreateOrderItemRequest(Guid ProductId, int Quantity);

public sealed record OrderResponse(
    Guid Id,
    string OrderNumber,
    string Status,
    string CustomerName,
    string CustomerEmail,
    string Phone,
    string Address,
    string Currency,
    decimal Subtotal,
    decimal Total,
    string? Notes,
    DateTimeOffset CreatedAt,
    List<OrderItemResponse> Items,
    List<PaymentAttemptResponse>? PaymentAttempts,
    List<TiendaOnline.Api.Modules.Billing.InvoiceResponse>? Invoices = null);

public sealed record PaymentAttemptResponse(
    Guid Id,
    decimal Amount,
    string Currency,
    string PaymentMethod,
    string Status,
    string? ProviderTransactionId,
    DateTimeOffset CreatedAt);

public sealed record OrderItemResponse(
    Guid ProductId,
    string ProductName,
    string ProductSlug,
    string Sku,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal);

internal static class OrderMappings
{
    public static OrderResponse ToResponse(this Order order)
    {
        return new OrderResponse(
            order.Id,
            order.OrderNumber,
            order.Status,
            order.CustomerName,
            order.CustomerEmail,
            order.Phone,
            order.Address,
            order.Currency,
            order.Subtotal,
            order.Total,
            order.Notes,
            order.CreatedAt,
            order.Items
                .Select(item => new OrderItemResponse(
                    item.ProductId,
                    item.ProductName,
                    item.ProductSlug,
                    item.Sku,
                    item.Quantity,
                    item.UnitPrice,
                    item.LineTotal))
                .ToList(),
            order.PaymentAttempts?
                .Select(p => new PaymentAttemptResponse(
                    p.Id,
                    p.Amount,
                    p.Currency,
                    p.PaymentMethod,
                    p.Status,
                    p.ProviderTransactionId,
                    p.CreatedAt))
                .OrderByDescending(p => p.CreatedAt)
                .ToList(),
            order.Invoices?
                .Select(i => TiendaOnline.Api.Modules.Billing.BillingMappings.ToResponse(i))
                .ToList());
    }
}
