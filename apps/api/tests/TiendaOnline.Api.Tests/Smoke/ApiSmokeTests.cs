using System.Net;
using TiendaOnline.Api.Tests.Helpers;
using Xunit;

namespace TiendaOnline.Api.Tests.Smoke;

public class ApiSmokeTests(AuthTestWebApplicationFactory factory)
    : IClassFixture<AuthTestWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Health_Liveness_ReturnsOk()
    {
        var response = await _client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task SystemInfo_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/system/info");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task SystemInfo_ReturnsExpectedFields()
    {
        var response = await _client.GetAsync("/api/v1/system/info");
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"name\"", body);
        Assert.Contains("\"version\"", body);
        Assert.Contains("\"environment\"", body);
        Assert.Contains("\"timestamp\"", body);
    }

    [Fact]
    public async Task PublicCatalog_ReturnsSeededProducts()
    {
        var response = await _client.GetAsync("/api/v1/catalog/products");
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("integration-office-kit", body);
        Assert.Contains("Integration Desk Light", body);
    }
}
