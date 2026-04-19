namespace TiendaOnline.Api.Configuration;

public sealed class AppOptions
{
    public const string SectionName = "App";

    public string Name { get; set; } = "TiendaOnline.Api";
    public string Version { get; set; } = "1.0.0";
}
