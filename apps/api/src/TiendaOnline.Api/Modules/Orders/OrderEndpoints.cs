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

            return Results.Created($"/api/v1/orders/{order.Id}", order.ToResponse());
        })
        .WithName("CreateOrder");

        var adminGroup = app.MapGroup("/api/v1/admin/orders")
            .WithTags("Admin Orders")
            .RequireAuthorization(AppPolicies.RequireAdmin);

        adminGroup.MapGet("/", async (AppCommerceContext dbContext) =>
        {
            var orders = await dbContext.Orders
                .AsNoTracking()
                .Include(order => order.Items)
                .Include(order => order.PaymentAttempts)
                .OrderByDescending(order => order.CreatedAt)
                .Select(order => order.ToResponse())
                .ToListAsync();

            return Results.Ok(orders);
        })
        .WithName("GetAdminOrders");
    }

    private static Dictionary<string, string[]>? ValidateOrderRequest(CreateOrderRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.CustomerName))
        {
            errors["customerName"] = ["Customer name is required."];
        }

        if (string.IsNullOrWhiteSpace(request.CustomerEmail) || !request.CustomerEmail.Contains('@'))
        {
            errors["customerEmail"] = ["A valid customer email is required."];
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
    List<PaymentAttemptResponse>? PaymentAttempts);

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
                .ToList());
    }
}
