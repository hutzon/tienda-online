using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using TiendaOnline.Api.Configuration;

namespace TiendaOnline.Api.Infrastructure.HealthChecks;

public sealed class RedisHealthCheck(IOptions<RedisOptions> options) : IHealthCheck
{
    private readonly string _connectionString = options.Value.ConnectionString;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var connection = await ConnectionMultiplexer.ConnectAsync(_connectionString);
            var db = connection.GetDatabase();
            await db.PingAsync();
            return HealthCheckResult.Healthy("Redis reachable.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Redis unreachable.", ex);
        }
    }
}
