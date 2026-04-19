using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace TiendaOnline.Api.Tests.Helpers;

public sealed class AuthTestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Auth:SecretKey"] = JwtTestHelper.TestSecretKey,
                ["Auth:Issuer"] = JwtTestHelper.TestIssuer,
                ["Auth:Audience"] = JwtTestHelper.TestAudience,
                ["Auth:TokenExpirationMinutes"] = "60"
            });
        });
    }
}
