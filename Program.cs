using System.Collections.Concurrent;
using System.Net;
using System.Security.Cryptography;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

var basicUser = Environment.GetEnvironmentVariable("FEL_MOCK_BASIC_USER") ?? "fel_user";
var basicPassword = Environment.GetEnvironmentVariable("FEL_MOCK_BASIC_PASSWORD") ?? "fel_pass";

var tokens = new ConcurrentDictionary<string, DateTimeOffset>();
var invoices = new ConcurrentDictionary<string, InvoiceRecord>();
var cancellations = new ConcurrentDictionary<string, CancellationRecord>();

app.MapGet("/test", () => Results.Ok(new { ok = true, message = "OK" }));

app.MapGet("/getToken", (HttpRequest request) =>
{
    if (!TryValidateBasicAuth(request, basicUser, basicPassword))
    {
        return Results.Unauthorized();
    }

    var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
    var expiresAt = DateTimeOffset.UtcNow.AddMinutes(60);

    tokens[token] = expiresAt;

    return Results.Ok(new
    {
        access_token = token,
        token_type = "mock",
        expires_in = 3600,
        expires_at = expiresAt
    });
});

app.MapPost("/postFactura", async (HttpRequest request) =>
{
    if (!TryValidateAccessToken(request, tokens))
    {
        return Results.Unauthorized();
    }

    using var reader = new StreamReader(request.Body, Encoding.UTF8);
    var payload = await reader.ReadToEndAsync();

    if (string.IsNullOrWhiteSpace(payload))
    {
        return Results.BadRequest(new
        {
            codigo = "EC",
            mensaje = "Payload vacío"
        });
    }

    var id = Guid.NewGuid().ToString("N");
    var record = new InvoiceRecord(
        Id: id,
        ReceivedAt: DateTimeOffset.UtcNow,
        Status: "RECIBIDO",
        Xml: payload
    );

    invoices[id] = record;

    return Results.Ok(new
    {
        codigo = "00",
        estado = "RECIBIDO",
        uuid = id,
        fecha = record.ReceivedAt,
        firma_sat = $"MOCK-SAT-{id[..12]}",
        mensaje = "DTE recibido correctamente por mock"
    });
});

app.MapPost("/postAnulacionDTE", async (HttpRequest request) =>
{
    if (!TryValidateAccessToken(request, tokens))
    {
        return Results.Unauthorized();
    }

    using var reader = new StreamReader(request.Body, Encoding.UTF8);
    var payload = await reader.ReadToEndAsync();

    if (string.IsNullOrWhiteSpace(payload))
    {
        return Results.BadRequest(new
        {
            codigo = "EC",
            mensaje = "Payload vacío"
        });
    }

    var id = Guid.NewGuid().ToString("N");
    var record = new CancellationRecord(
        Id: id,
        ReceivedAt: DateTimeOffset.UtcNow,
        Status: "ANULACION_RECIBIDA",
        Xml: payload
    );

    cancellations[id] = record;

    return Results.Ok(new
    {
        codigo = "00",
        estado = "ANULACION_RECIBIDA",
        uuid = id,
        fecha = record.ReceivedAt,
        mensaje = "Anulación recibida correctamente por mock"
    });
});

app.MapGet("/facturas/{id}", (string id) =>
{
    return invoices.TryGetValue(id, out var record)
        ? Results.Ok(record)
        : Results.NotFound(new { message = "Factura no encontrada" });
});

app.MapGet("/catalogos/medios-pago", () => Results.Ok(new[]
{
    new { code = "TC", name = "Tarjeta de Crédito" },
    new { code = "TD", name = "Tarjeta de Débito" },
    new { code = "EF", name = "Efectivo" },
    new { code = "CH", name = "Cheque" }
}));

app.Run();

static bool TryValidateBasicAuth(HttpRequest request, string expectedUser, string expectedPassword)
{
    if (!request.Headers.TryGetValue("Authorization", out var values))
    {
        return false;
    }

    var header = values.ToString();
    if (!header.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
    {
        return false;
    }

    try
    {
        var encoded = header["Basic ".Length..].Trim();
        var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(encoded));
        var parts = decoded.Split(':', 2);

        if (parts.Length != 2)
        {
            return false;
        }

        return parts[0] == expectedUser && parts[1] == expectedPassword;
    }
    catch
    {
        return false;
    }
}

static bool TryValidateAccessToken(HttpRequest request, ConcurrentDictionary<string, DateTimeOffset> tokens)
{
    if (!request.Headers.TryGetValue("Access_Token", out var values))
    {
        return false;
    }

    var token = values.ToString();
    if (string.IsNullOrWhiteSpace(token))
    {
        return false;
    }

    if (!tokens.TryGetValue(token, out var expiresAt))
    {
        return false;
    }

    return expiresAt > DateTimeOffset.UtcNow;
}

public sealed record InvoiceRecord(
    string Id,
    DateTimeOffset ReceivedAt,
    string Status,
    string Xml
);

public sealed record CancellationRecord(
    string Id,
    DateTimeOffset ReceivedAt,
    string Status,
    string Xml
);
