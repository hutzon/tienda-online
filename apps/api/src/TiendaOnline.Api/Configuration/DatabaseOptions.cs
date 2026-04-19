namespace TiendaOnline.Api.Configuration;

public sealed class DatabaseOptions
{
    public const string SectionName = "Database";

    public string ConnectionString { get; set; } =
        "Host=localhost;Port=5432;Database=tienda_online;Username=tienda_online;Password=tienda_online_local";
}
