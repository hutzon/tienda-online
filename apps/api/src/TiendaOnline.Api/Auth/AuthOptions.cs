namespace TiendaOnline.Api.Auth;

public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    public string Issuer { get; set; } = "TiendaOnline.Api";
    public string Audience { get; set; } = "TiendaOnline.Clients";

    /// <summary>
    /// HMAC-SHA256 signing key. Minimum 32 characters. Set via environment variable
    /// Auth__SecretKey in production. Never hardcode a real secret here.
    /// </summary>
    public string SecretKey { get; set; } = string.Empty;

    public int TokenExpirationMinutes { get; set; } = 60;
}
