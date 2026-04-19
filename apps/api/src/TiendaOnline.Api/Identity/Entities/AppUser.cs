using TiendaOnline.Api.Auth;

namespace TiendaOnline.Api.Identity.Entities;

public sealed class AppUser
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// BCrypt hash of the user's password. Never stored in plain text.
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    public string Role { get; set; } = AppRoles.Customer;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
