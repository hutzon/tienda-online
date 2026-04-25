namespace TiendaOnline.Api.Configuration;

public sealed class DatabaseOptions
{
    public const string SectionName = "Database";

    public string ConnectionString { get; set; } =
        "Host=localhost;Port=5432;Database=tienda_online;Username=tienda_online;Password=tienda_online_local";

    public bool UseInMemoryForTesting { get; set; }

    public string InMemoryDatabaseName { get; set; } = "tienda-online-tests";

    public bool ApplySqlMigrationsOnStartup { get; set; }

    public bool SeedDevelopmentData { get; set; }
}
