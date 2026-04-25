using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using TiendaOnline.Api.Auth;
using TiendaOnline.Api.Modules.Catalog;
using TiendaOnline.Api.Modules.Orders;
using TiendaOnline.Api.Tests.Helpers;
using Xunit;

namespace TiendaOnline.Api.Tests.Commerce;

public sealed class CommerceFlowTests(AuthTestWebApplicationFactory factory)
    : IClassFixture<AuthTestWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task AdminCatalog_CreateProduct_Then_PublicCatalog_ReturnsIt()
    {
        var token = JwtTestHelper.GenerateToken("catalog-admin", AppRoles.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createRequest = new UpsertProductRequest(
            "Mechanical Keyboard",
            null,
            "KB-100",
            "Accessories",
            "Teclado mecanico base para pruebas.",
            "Producto creado por el admin para validar flujo real de catalogo.",
            499.00m,
            true,
            7);

        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/catalog/products", createRequest);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var publicCatalogResponse = await _client.GetAsync("/api/v1/catalog/products");
        publicCatalogResponse.EnsureSuccessStatusCode();

        var body = await publicCatalogResponse.Content.ReadAsStringAsync();
        Assert.Contains("mechanical-keyboard", body);
        Assert.Contains("KB-100", await createResponse.Content.ReadAsStringAsync());

        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task Inventory_UpdateStock_ReflectsInAdminCatalog()
    {
        var token = JwtTestHelper.GenerateToken("inventory-admin", AppRoles.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var products = await _client.GetFromJsonAsync<List<AdminCatalogProductSummary>>("/api/v1/admin/catalog/products");
        Assert.NotNull(products);

        var product = products!.First(item => item.Slug == "integration-office-kit");
        var updateResponse = await _client.PutAsJsonAsync(
            $"/api/v1/admin/inventory/products/{product.Id}/stock",
            new Modules.Inventory.UpdateStockRequest(22));

        updateResponse.EnsureSuccessStatusCode();

        var refreshedProducts = await _client.GetFromJsonAsync<List<AdminCatalogProductSummary>>("/api/v1/admin/catalog/products");
        var refreshedProduct = refreshedProducts!.First(item => item.Id == product.Id);
        Assert.Equal(22, refreshedProduct.StockOnHand);

        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task Checkout_FullFlow_CashOnDelivery_ReturnsConfirmed()
    {
        var products = await _client.GetFromJsonAsync<List<PublicCatalogProductSummary>>("/api/v1/catalog/products");
        Assert.NotNull(products);

        var product = products!.First(item => item.Slug == "integration-office-kit");
        var createSessionRequest = new TiendaOnline.Api.Modules.Checkout.CreateCheckoutSessionRequest(
            [new CreateOrderItemRequest(product.Id, 2)]);

        var sessionResponse = await _client.PostAsJsonAsync("/api/v1/checkout/sessions", createSessionRequest);
        sessionResponse.EnsureSuccessStatusCode();
        var session = await sessionResponse.Content.ReadFromJsonAsync<TiendaOnline.Api.Modules.Checkout.CheckoutSessionResponse>();
        Assert.NotNull(session);
        Assert.Equal("Active", session!.Status);

        var customerRequest = new TiendaOnline.Api.Modules.Checkout.UpdateCustomerRequest(
            "Cliente Demo", "cliente.demo@example.com", "55551234", "12 Calle Zona 1");
        var updateCustomerResponse = await _client.PutAsJsonAsync($"/api/v1/checkout/sessions/{session.Id}/customer", customerRequest);
        updateCustomerResponse.EnsureSuccessStatusCode();

        var paymentMethodRequest = new TiendaOnline.Api.Modules.Checkout.SelectPaymentMethodRequest("CashOnDelivery");
        var paymentMethodResponse = await _client.PostAsJsonAsync($"/api/v1/checkout/sessions/{session.Id}/payment-method", paymentMethodRequest);
        paymentMethodResponse.EnsureSuccessStatusCode();

        var paymentResult = await paymentMethodResponse.Content.ReadFromJsonAsync<System.Text.Json.Nodes.JsonObject>();
        Assert.Equal("Confirmed", paymentResult!["orderStatus"]?.ToString());
    }
}
