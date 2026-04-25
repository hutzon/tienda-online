using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace TiendaOnline.Api.Modules.Billing.Providers;

public sealed class MockFelProvider(HttpClient httpClient, IConfiguration configuration, ILogger<MockFelProvider> logger) : IFelProvider
{
    private string? _cachedToken;
    private DateTimeOffset _tokenExpiresAt;

    public async Task<FelResponse> EmitInvoiceAsync(Entities.Invoice invoice, CancellationToken cancellationToken)
    {
        var mockUrl = configuration["FelMock:BaseUrl"] ?? "http://127.0.0.1:5153";
        var user = configuration["FelMock:User"] ?? "fel_user";
        var password = configuration["FelMock:Password"] ?? "fel_pass";

        try
        {
            if (string.IsNullOrEmpty(_cachedToken) || DateTimeOffset.UtcNow >= _tokenExpiresAt)
            {
                var tokenRequest = new HttpRequestMessage(HttpMethod.Get, $"{mockUrl}/getToken");
                var authBytes = Encoding.UTF8.GetBytes($"{user}:{password}");
                tokenRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(authBytes));

                var tokenRes = await httpClient.SendAsync(tokenRequest, cancellationToken);
                tokenRes.EnsureSuccessStatusCode();

                var tokenData = await tokenRes.Content.ReadFromJsonAsync<JsonObject>(cancellationToken: cancellationToken);
                _cachedToken = tokenData?["access_token"]?.ToString();
                
                if (DateTimeOffset.TryParse(tokenData?["expires_at"]?.ToString(), out var expiresAt))
                {
                    _tokenExpiresAt = expiresAt;
                }
            }

            if (string.IsNullOrEmpty(_cachedToken))
            {
                return new FelResponse(false, null, null, null, null, "Failed to get access token from Mock FEL.");
            }

            var emitRequest = new HttpRequestMessage(HttpMethod.Post, $"{mockUrl}/postFactura");
            emitRequest.Headers.Add("Access_Token", _cachedToken);
            
            // XML simulado basado en el payload del Invoice (si existe) o uno base
            var payload = invoice.PayloadSent ?? "<dte><mock>factura</mock></dte>";
            emitRequest.Content = new StringContent(payload, Encoding.UTF8, "application/xml");

            var emitRes = await httpClient.SendAsync(emitRequest, cancellationToken);
            var rawResponse = await emitRes.Content.ReadAsStringAsync(cancellationToken);

            if (!emitRes.IsSuccessStatusCode)
            {
                return new FelResponse(false, null, null, null, rawResponse, $"HTTP Status {emitRes.StatusCode}");
            }

            var responseData = JsonSerializer.Deserialize<JsonObject>(rawResponse);
            var uuid = responseData?["uuid"]?.ToString();
            var signature = responseData?["firma_sat"]?.ToString();
            var status = responseData?["estado"]?.ToString();

            return new FelResponse(true, uuid, signature, status, rawResponse, null);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error comunicándose con el Mock FEL.");
            return new FelResponse(false, null, null, null, null, ex.Message);
        }
    }
}
