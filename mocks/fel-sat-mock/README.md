# FEL/SAT Mock

Ubicacion canonica actual del mock FEL/SAT para el monorepo.

## Estado

- Esta carpeta es la fuente oficial del mock para desarrollo local.
- El contenido se alineo con el mock heredado de `TiendaOnline_Master_Plan/mocks/fel-sat-mock/`.
- `Program.cs` en la raiz queda solo como referencia historica temporal y no debe usarse como entrypoint operativo.

## Endpoints

- `GET /test`
- `GET /getToken`
- `POST /postFactura`
- `POST /postAnulacionDTE`
- `GET /catalogos/medios-pago`
- `GET /facturas/{id}`

## Variables de entorno

- `FEL_MOCK_BASIC_USER`
- `FEL_MOCK_BASIC_PASSWORD`
- `ASPNETCORE_URLS`

## Ejecucion

```powershell
dotnet run --project mocks/fel-sat-mock/FelSatMock.Api.csproj
```
