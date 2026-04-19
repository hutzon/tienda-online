using System.Net;
using System.Net.Http.Headers;
using TiendaOnline.Api.Auth;
using TiendaOnline.Api.Tests.Helpers;
using Xunit;

namespace TiendaOnline.Api.Tests.Auth;

public class AuthEndpointTests(AuthTestWebApplicationFactory factory)
    : IClassFixture<AuthTestWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task AdminPing_WithoutToken_Returns401()
    {
        var response = await _client.GetAsync("/api/v1/admin/ping");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AdminPing_WithAdminToken_Returns200()
    {
        var token = JwtTestHelper.GenerateToken("test-admin", AppRoles.Admin);
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/v1/admin/ping");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task AdminPing_WithCustomerToken_Returns403()
    {
        var token = JwtTestHelper.GenerateToken("test-customer", AppRoles.Customer);
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/v1/admin/ping");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task AdminPing_WithStaffToken_Returns403()
    {
        var token = JwtTestHelper.GenerateToken("test-staff", AppRoles.Staff);
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/v1/admin/ping");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

        _client.DefaultRequestHeaders.Authorization = null;
    }
}
