using Microsoft.EntityFrameworkCore;
using TiendaOnline.Api.Modules.Commerce;
using TiendaOnline.Api.Modules.Payments.Entities;

namespace TiendaOnline.Api.Modules.Payments;

public static class PaymentEndpoints
{
    public static void MapPaymentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/payments")
            .WithTags("Payments");

        group.MapPost("/simulate", async (
            SimulatePaymentRequest request,
            AppCommerceContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var paymentAttempt = await dbContext.PaymentAttempts
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p => p.Id == request.PaymentAttemptId, cancellationToken);

            if (paymentAttempt is null) return Results.NotFound(new { message = "Payment attempt not found." });

            if (paymentAttempt.Status != PaymentStatuses.Pending)
            {
                return Results.BadRequest(new { message = $"Payment is already in status: {paymentAttempt.Status}" });
            }

            var order = paymentAttempt.Order!;
            paymentAttempt.UpdatedAt = DateTimeOffset.UtcNow;

            if (request.Success)
            {
                paymentAttempt.Status = PaymentStatuses.Paid;
                paymentAttempt.ProviderTransactionId = $"sim_{Guid.NewGuid():N}";
                order.Status = OrderStatuses.Confirmed;
            }
            else
            {
                paymentAttempt.Status = PaymentStatuses.Failed;
                // Leave order in PendingPayment so user can try again
            }

            // Also find active session and complete it if payment succeeded
            if (request.Success)
            {
                var session = await dbContext.CheckoutSessions
                    .FirstOrDefaultAsync(s => s.OrderId == order.Id && s.Status == CheckoutSessionStatuses.Active, cancellationToken);
                
                if (session != null)
                {
                    session.Status = CheckoutSessionStatuses.Completed;
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new { PaymentStatus = paymentAttempt.Status, OrderStatus = order.Status });
        })
        .WithName("SimulatePayment");
    }
}

public sealed record SimulatePaymentRequest(Guid PaymentAttemptId, bool Success);
