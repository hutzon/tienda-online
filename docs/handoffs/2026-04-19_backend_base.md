# Handoff - Backend base profesional

Fecha: 2026-04-19
Agente: Claude Sonnet 4.6
Estado: completado

## Contexto recibido

- Monorepo inicializado con `npm workspaces`, .NET 10, PostgreSQL y Redis.
- `apps/api` existía con estructura mínima: `/health`, configuración de DB y Redis, `ModuleMarker`.
- Tarea: construir la base profesional del backend sin módulos de negocio ni autenticación completa.

## Trabajo realizado

### Reorganización y nueva estructura

```
apps/api/
  src/TiendaOnline.Api/
    Configuration/        AppOptions, DatabaseOptions, RedisOptions
    Endpoints/            SystemEndpoints (/api/v1/system/info)
    Infrastructure/
      HealthChecks/       DatabaseHealthCheck, RedisHealthCheck
      InfrastructureExtensions.cs
    Middleware/           GlobalExceptionHandler
    Modules/              ModuleMarker (placeholder)
  tests/TiendaOnline.Api.Tests/
    Smoke/                ApiSmokeTests (3 tests)
```

### Paquetes NuGet agregados al proyecto principal
- `Npgsql 9.0.3` — driver PostgreSQL para health check de base de datos.
- `StackExchange.Redis 2.8.41` — cliente Redis para health check.

### Paquetes NuGet en el proyecto de tests
- `Microsoft.NET.Test.Sdk 17.13.0`
- `xunit 2.9.3`
- `xunit.runner.visualstudio 2.8.2`
- `Microsoft.AspNetCore.Mvc.Testing` (resuelto a `10.0.0-preview.3.25172.1`)

### Decisiones técnicas de esta tarea

1. **Patrón liveness/readiness en health checks.**
   `/health` siempre retorna 200 si el proceso está vivo (no conecta a dependencias).
   `/health/ready` verifica PostgreSQL y Redis realmente; retorna 503 si no alcanzan.
   Justificación: permite separar el estado del proceso del estado de las dependencias,
   y los smoke tests pasan incluso sin Docker corriendo.

2. **`GlobalExceptionHandler` vía `IExceptionHandler`.**
   Usa la interfaz de .NET 8+ para interceptar excepciones no manejadas y devolver
   RFC 7807 ProblemDetails con status 500.
   Justificación: manejo centralizado sin middleware personalizado extra.

3. **API versionada con prefijo `/api/v1/` simple.**
   Sin agregar el paquete `Asp.Versioning` todavía.
   Justificación: no hay suficientes endpoints para justificar la complejidad del paquete
   de versionado en esta fase.

4. **`InfrastructureExtensions` como punto único de registro.**
   Toda la configuración de dependencias de infraestructura se registra desde un método
   de extensión, dejando `Program.cs` limpio y orientado a composición.

5. **`public partial class Program {}` al final de `Program.cs`.**
   Expone `Program` al proyecto de tests para `WebApplicationFactory<Program>`.

6. **Logging JSON estructurado con `AddJsonConsole`.**
   Con `IncludeScopes = true` y formato ISO de timestamp.
   Justificación: base para observabilidad futura sin agregar librerías extra.

## Validaciones ejecutadas

- `dotnet build apps/api/TiendaOnline.Api.slnx` → Compilación correcta, 0 advertencias, 0 errores.
- `dotnet test apps/api/tests/TiendaOnline.Api.Tests/TiendaOnline.Api.Tests.csproj --no-build` → 3/3 correctos.
  - `Health_Liveness_ReturnsOk` ✓
  - `SystemInfo_ReturnsOk` ✓
  - `SystemInfo_ReturnsExpectedFields` ✓

## Endpoints disponibles

| Endpoint | Método | Descripción |
|---|---|---|
| `/health` | GET | Liveness: 200 si el proceso responde |
| `/health/ready` | GET | Readiness: verifica PostgreSQL y Redis |
| `/api/v1/system/info` | GET | Info del sistema: nombre, versión, entorno, timestamp |

## Problemas encontrados y resueltos

- **`xunit` types no encontrados en build inicial.**
  Causa: `ImplicitUsings` no importa namespaces de terceros automáticamente.
  Solución: agregar `using Xunit;` explícitamente en el smoke test.

- **`dotnet restore` en solución reportaba "todos actualizados" sin restaurar el nuevo proyecto.**
  Causa: caché de estado del workspace.
  Solución: `dotnet restore` directo sobre el `.csproj` del proyecto de tests con `--force`.

## Limitaciones conocidas

- `Microsoft.AspNetCore.Mvc.Testing` se resuelve a una versión preview (`10.0.0-preview.3.25172.1`)
  porque el canal de distribución de .NET 10 usa ese versioning. Los tests funcionan correctamente.
- `/health/ready` retorna 503 si PostgreSQL o Redis no están corriendo. Requiere `docker compose up -d`.
- OpenAPI no está incorporado todavía (diferido intencionalmente).

## Recomendaciones para el siguiente agente

1. Usar `dotnet test apps/api/TiendaOnline.Api.slnx` para correr todos los tests del backend.
2. Si se agrega autenticación base, crear `src/TiendaOnline.Api/Auth/` con extensión `AddAuth()` similar a `AddInfrastructure()`.
3. Si se agrega OpenAPI, documentarlo explícitamente: agregar `Swashbuckle.AspNetCore` o usar el soporte nativo de .NET 9+ con `Microsoft.AspNetCore.OpenApi`.
4. El próximo módulo de negocio debe ir en `src/TiendaOnline.Api/Modules/` como subcarpeta, no en la raíz del proyecto.
5. No avanzar todavía a catálogo, carrito, checkout, pagos reales ni FEL real.
6. Considerar agregar middleware de request logging (log de método, ruta y status code) como siguiente mejora de observabilidad.
