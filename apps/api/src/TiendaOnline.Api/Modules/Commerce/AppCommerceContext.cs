using Microsoft.EntityFrameworkCore;
using TiendaOnline.Api.Modules.Catalog.Entities;
using TiendaOnline.Api.Modules.Inventory.Entities;
using TiendaOnline.Api.Modules.Orders.Entities;

using TiendaOnline.Api.Modules.Checkout.Entities;
using TiendaOnline.Api.Modules.Payments.Entities;
using TiendaOnline.Api.Modules.Billing.Entities;

namespace TiendaOnline.Api.Modules.Commerce;

public sealed class AppCommerceContext(DbContextOptions<AppCommerceContext> options)
    : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();

    public DbSet<Product> Products => Set<Product>();

    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();

    public DbSet<Order> Orders => Set<Order>();

    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    public DbSet<CheckoutSession> CheckoutSessions => Set<CheckoutSession>();

    public DbSet<PaymentAttempt> PaymentAttempts => Set<PaymentAttempt>();

    public DbSet<Invoice> Invoices => Set<Invoice>();

    public DbSet<InvoiceLine> InvoiceLines => Set<InvoiceLine>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("commerce");

        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("categories");
            entity.HasKey(category => category.Id);
            entity.Property(category => category.Name).HasMaxLength(120).IsRequired();
            entity.Property(category => category.Slug).HasMaxLength(140).IsRequired();
            entity.Property(category => category.CreatedAt).IsRequired();
            entity.HasIndex(category => category.Slug).IsUnique();
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");
            entity.HasKey(product => product.Id);
            entity.Property(product => product.Name).HasMaxLength(180).IsRequired();
            entity.Property(product => product.Slug).HasMaxLength(180).IsRequired();
            entity.Property(product => product.Sku).HasMaxLength(100).IsRequired();
            entity.Property(product => product.Summary).HasMaxLength(320).IsRequired();
            entity.Property(product => product.Description).HasMaxLength(4000).IsRequired();
            entity.Property(product => product.Price).HasPrecision(18, 2).IsRequired();
            entity.Property(product => product.Currency).HasMaxLength(3).IsRequired();
            entity.Property(product => product.CreatedAt).IsRequired();
            entity.Property(product => product.UpdatedAt).IsRequired();
            entity.HasIndex(product => product.Slug).IsUnique();
            entity.HasIndex(product => product.Sku).IsUnique();

            entity.HasOne(product => product.Category)
                .WithMany(category => category.Products)
                .HasForeignKey(product => product.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(product => product.InventoryItem)
                .WithOne(inventory => inventory.Product)
                .HasForeignKey<InventoryItem>(inventory => inventory.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<InventoryItem>(entity =>
        {
            entity.ToTable("inventory_items");
            entity.HasKey(inventory => inventory.ProductId);
            entity.Property(inventory => inventory.StockOnHand).IsRequired();
            entity.Property(inventory => inventory.UpdatedAt).IsRequired();
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("orders");
            entity.HasKey(order => order.Id);
            entity.Property(order => order.OrderNumber).HasMaxLength(40).IsRequired();
            entity.Property(order => order.Status).HasMaxLength(30).IsRequired();
            entity.Property(order => order.CustomerName).HasMaxLength(180).IsRequired();
            entity.Property(order => order.CustomerEmail).HasMaxLength(200).IsRequired();
            entity.Property(order => order.Phone).HasMaxLength(50).IsRequired();
            entity.Property(order => order.Address).HasMaxLength(1000).IsRequired();
            entity.Property(order => order.Currency).HasMaxLength(3).IsRequired();
            entity.Property(order => order.Subtotal).HasPrecision(18, 2).IsRequired();
            entity.Property(order => order.Total).HasPrecision(18, 2).IsRequired();
            entity.Property(order => order.Notes).HasMaxLength(1000);
            entity.Property(order => order.CreatedAt).IsRequired();
            entity.HasIndex(order => order.OrderNumber).IsUnique();
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("order_items");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.ProductName).HasMaxLength(180).IsRequired();
            entity.Property(item => item.ProductSlug).HasMaxLength(180).IsRequired();
            entity.Property(item => item.Sku).HasMaxLength(100).IsRequired();
            entity.Property(item => item.Quantity).IsRequired();
            entity.Property(item => item.UnitPrice).HasPrecision(18, 2).IsRequired();
            entity.Property(item => item.LineTotal).HasPrecision(18, 2).IsRequired();

            entity.HasOne(item => item.Order)
                .WithMany(order => order.Items)
                .HasForeignKey(item => item.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(item => item.Product)
                .WithMany(product => product.OrderItems)
                .HasForeignKey(item => item.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CheckoutSession>(entity =>
        {
            entity.ToTable("checkout_sessions");
            entity.HasKey(session => session.Id);
            entity.Property(session => session.Status).HasMaxLength(30).IsRequired();
            entity.Property(session => session.ExpiresAt).IsRequired();
            entity.Property(session => session.CreatedAt).IsRequired();

            entity.HasOne(session => session.Order)
                .WithMany()
                .HasForeignKey(session => session.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PaymentAttempt>(entity =>
        {
            entity.ToTable("payment_attempts");
            entity.HasKey(payment => payment.Id);
            entity.Property(payment => payment.Amount).HasPrecision(18, 2).IsRequired();
            entity.Property(payment => payment.Currency).HasMaxLength(3).IsRequired();
            entity.Property(payment => payment.PaymentMethod).HasMaxLength(50).IsRequired();
            entity.Property(payment => payment.Status).HasMaxLength(30).IsRequired();
            entity.Property(payment => payment.ProviderTransactionId).HasMaxLength(200);
            entity.Property(payment => payment.CreatedAt).IsRequired();
            entity.Property(payment => payment.UpdatedAt).IsRequired();

            entity.HasOne(payment => payment.Order)
                .WithMany(order => order.PaymentAttempts)
                .HasForeignKey(payment => payment.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.ToTable("invoices");
            entity.HasKey(invoice => invoice.Id);
            entity.Property(invoice => invoice.Uuid).HasMaxLength(100);
            entity.Property(invoice => invoice.SatSignature).HasMaxLength(255);
            entity.Property(invoice => invoice.Status).HasMaxLength(30).IsRequired();
            entity.Property(invoice => invoice.Subtotal).HasPrecision(18, 2).IsRequired();
            entity.Property(invoice => invoice.TaxAmount).HasPrecision(18, 2).IsRequired();
            entity.Property(invoice => invoice.Total).HasPrecision(18, 2).IsRequired();
            entity.Property(invoice => invoice.CreatedAt).IsRequired();
            
            entity.HasOne(invoice => invoice.Order)
                .WithMany(order => order.Invoices)
                .HasForeignKey(invoice => invoice.OrderId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<InvoiceLine>(entity =>
        {
            entity.ToTable("invoice_lines");
            entity.HasKey(line => line.Id);
            entity.Property(line => line.ProductName).HasMaxLength(180).IsRequired();
            entity.Property(line => line.Sku).HasMaxLength(100).IsRequired();
            entity.Property(line => line.Quantity).IsRequired();
            entity.Property(line => line.UnitPrice).HasPrecision(18, 2).IsRequired();
            entity.Property(line => line.LineTotal).HasPrecision(18, 2).IsRequired();

            entity.HasOne(line => line.Invoice)
                .WithMany(invoice => invoice.Lines)
                .HasForeignKey(line => line.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
