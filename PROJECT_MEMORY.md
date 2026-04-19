# PROJECT MEMORY - TiendaOnline

## Objetivo del proyecto
Construir una tienda online profesional con:
- web pública
- apps móviles
- panel administrativo
- PostgreSQL
- pagos online y contra entrega
- integración futura con FEL/SAT
- mock local FEL para desarrollo

## Decisiones vigentes
- Web storefront y admin: Next.js + TypeScript.
- Mobile: Expo / React Native + TypeScript.
- Backend: ASP.NET Core Web API como modular monolith inicial.
- Package manager y estrategia de monorepo: `npm workspaces`.
- Node fijado: `22.13.1`.
- .NET SDK fijado: `10.0.103`.
- Base de datos local: PostgreSQL `17-alpine`.
- Redis local: `7.4-alpine`.
- Mock FEL/SAT oficial: `mocks/fel-sat-mock/`.
- `Program.cs` en la raíz queda solo como referencia histórica temporal.
- No se implementan todavía pagos reales, SAT/FEL real ni pantallas completas de negocio.
- Backend base completado con arquitectura por capas simple (Configuration, Infrastructure, Middleware, Endpoints, Auth, Identity).
- Health checks con patrón liveness (`/health`) y readiness (`/health/ready`).
- API versionada bajo prefijo `/api/v1/`.
- Autenticación JWT Bearer con roles y políticas de autorización.
- `Microsoft.AspNetCore.Authentication.JwtBearer` en .NET 10 debe agregarse como paquete NuGet explícito (fue removido del shared framework en .NET 10).
- `JwtBearerOptions` configuradas de forma lazy via `IOptions<AuthOptions>` para que las sobreescrituras de tests funcionen correctamente.
- Identidad gestionada con modelo simple (`AppUser` + rol como string), sin ASP.NET Core Identity completo.
- Migraciones SQL manuales en `infra/db/migrations/`.
- `.gitignore` revisado y completo para el monorepo (Node, .NET, Expo, IDEs, logs).
- `.claude/` excluido del repositorio (configuración interna de la herramienta).
- Panel admin usa token cookie `admin_token` para autenticación de desarrollo.
- Middleware Next.js protege todas las rutas admin; redirige a `/login` si no hay token.
- Token JWT almacenado como cookie con SameSite=Strict, expira en 1 día.
- `next build` falla con `TypeError: generate is not a function` en Next.js 16.0.10 en este entorno (error pre-existente, afecta también a `web-store`). El typecheck (`tsc --noEmit`) pasa correctamente.

## Resumen de lo realizado

### Tarea 1: Scaffolding monorepo
- Se inicializó el monorepo real con `package.json`, `package-lock.json`, `.npmrc`, `.nvmrc`, `global.json`, `.editorconfig` y `.gitignore`.
- Se bootstrapearon `apps/web-store`, `apps/web-admin`, `apps/mobile-app` y `apps/api`.
- Se preparó la infraestructura local con `docker-compose.yml` para PostgreSQL y Redis.
- Se formalizó `mocks/fel-sat-mock/` como ubicación canónica del mock FEL/SAT.

### Tarea 2: Backend base profesional
- Se reorganizó `apps/api` con arquitectura por capas simple.
- Se agregaron paquetes `Npgsql 9.0.3` y `StackExchange.Redis 2.8.41`.
- Se implementaron health checks con `DatabaseHealthCheck` y `RedisHealthCheck`.
- Se implementó `GlobalExceptionHandler` con `IExceptionHandler` y respuesta RFC 7807.
- Se creó `SystemEndpoints` con `/api/v1/system/info`.
- Se creó proyecto de tests `TiendaOnline.Api.Tests` con smoke tests.
- Build limpio: 0 warnings, 0 errores. Tests: 3/3 correctos.

### Tarea 3: Base de autenticación y autorización
- Se actualizó `.gitignore` con cobertura completa del monorepo.
- Se agregó `Microsoft.AspNetCore.Authentication.JwtBearer 10.0.3` y `Npgsql.EntityFrameworkCore.PostgreSQL 9.0.3`.
- Se implementaron `AuthOptions`, `AppRoles`, `AppPolicies` y `AuthExtensions` con JWT Bearer.
- Se crearon entidades de identidad: `AppUser` y `AppIdentityContext` (EF Core + Npgsql).
- Se creó `IdentityExtensions` para registro del DbContext.
- Se creó endpoint protegido `GET /api/v1/admin/ping` (requiere rol `Admin`).
- Se creó endpoint de desarrollo `POST /api/v1/auth/dev/token` (solo en `Development`).
- Se creó migración SQL en `infra/db/migrations/001_create_identity_tables.sql`.
- Se crearon tests de autorización: 401 sin token, 200 con Admin, 403 con Customer/Staff.
- Build limpio: 0 warnings, 0 errores. Tests: 7/7 correctos.
- Primer commit del repositorio ejecutado.

### Tarea 4: Base administrativa inicial (web-admin)
- Se construyó la estructura completa del panel administrativo en `apps/web-admin`.
- Capa de API cliente con manejo de token, errores y configuración por variables de entorno.
- Sesión de desarrollo basada en cookie `admin_token` compatible con middleware Next.js.
- Middleware de protección de rutas (`middleware.ts`) que redirige a `/login` si no hay token.
- Página de login conectada a `POST /api/v1/auth/dev/token`.
- Layout administrativo persistente con Sidebar (navegación) y Topbar (logout).
- Dashboard funcional con consumo de `/api/v1/system/info` y `/api/v1/admin/ping`.
- Páginas placeholder estructuradas: `/catalog`, `/inventory`, `/orders`, `/customers`, `/settings`.
- Raíz `/` redirige automáticamente a `/dashboard`.
- CSS dark theme consistente con el bootstrap previo.
- TypeScript typecheck: 0 errores, 0 advertencias.
- `next build` muestra error pre-existente de Next.js 16.0.10 en este entorno (ver riesgos).

## Estructura completa de apps/api

```
apps/api/
  TiendaOnline.Api.slnx
  src/
    TiendaOnline.Api/
      Auth/
        AppPolicies.cs              ← constantes de políticas
        AppRoles.cs                 ← constantes de roles (Admin, Staff, Customer)
        AuthExtensions.cs           ← AddAuth() con JWT Bearer y políticas
        AuthOptions.cs              ← opciones de JWT (Issuer, Audience, SecretKey)
      Configuration/
        AppOptions.cs
        DatabaseOptions.cs
        RedisOptions.cs
      Endpoints/
        AdminEndpoints.cs           ← GET /api/v1/admin/ping (protegido)
        DevAuthEndpoints.cs         ← POST /api/v1/auth/dev/token (solo dev)
        SystemEndpoints.cs          ← GET /api/v1/system/info
      Identity/
        Entities/
          AppUser.cs                ← entidad usuario (Id, Username, Email, PasswordHash, Role)
        AppIdentityContext.cs       ← DbContext con schema 'identity'
        IdentityExtensions.cs       ← AddIdentityPersistence()
      Infrastructure/
        HealthChecks/
          DatabaseHealthCheck.cs
          RedisHealthCheck.cs
        InfrastructureExtensions.cs
      Middleware/
        GlobalExceptionHandler.cs
      Modules/
        ModuleMarker.cs
      Program.cs
      appsettings.json
      appsettings.Development.json
      TiendaOnline.Api.csproj
  tests/
    TiendaOnline.Api.Tests/
      Auth/
        AuthEndpointTests.cs        ← 4 tests de autorización
      Helpers/
        AuthTestWebApplicationFactory.cs
        JwtTestHelper.cs
      Smoke/
        ApiSmokeTests.cs            ← 3 smoke tests
      TiendaOnline.Api.Tests.csproj
```

## Estructura completa de apps/web-admin

```
apps/web-admin/
  app/
    (admin)/
      layout.tsx                    ← layout admin con Sidebar y Topbar
      dashboard/
        page.tsx                    ← dashboard con system/info y admin/ping
      catalog/
        page.tsx                    ← placeholder
      inventory/
        page.tsx                    ← placeholder
      orders/
        page.tsx                    ← placeholder
      customers/
        page.tsx                    ← placeholder
      settings/
        page.tsx                    ← placeholder
    login/
      page.tsx                      ← formulario de acceso de desarrollo
    globals.css                     ← dark theme admin
    layout.tsx                      ← root layout
    page.tsx                        ← redirect → /dashboard
  components/
    admin/
      Sidebar.tsx                   ← navegación lateral
      Topbar.tsx                    ← header con logout
      PlaceholderPage.tsx           ← componente reutilizable para páginas placeholder
  lib/
    api/
      client.ts                     ← apiFetch base con manejo de token y errores
      auth.ts                       ← requestDevToken()
      system.ts                     ← getSystemInfo(), pingAdmin()
    session.ts                      ← getToken(), setToken(), clearToken() (cookie)
  middleware.ts                     ← protección de rutas
  .env.local                        ← variables de entorno locales (gitignored)
  next.config.ts
  tsconfig.json
  package.json
```

## Endpoints disponibles
- `GET /health` → liveness, siempre 200.
- `GET /health/ready` → readiness, verifica PostgreSQL y Redis.
- `GET /api/v1/system/info` → nombre, versión, entorno, timestamp.
- `GET /api/v1/admin/ping` → requiere JWT con rol `Admin` (401 sin token, 403 con rol incorrecto).
- `POST /api/v1/auth/dev/token` → genera JWT de desarrollo (solo entorno Development).

## Riesgos o bloqueos vigentes
- `Microsoft.AspNetCore.Authentication.JwtBearer` fue removido del shared framework en .NET 10 y requiere paquete NuGet explícito (`10.0.3`).
- `/health/ready` retornará 503 si PostgreSQL o Redis no están accesibles (requiere `docker compose up -d`).
- OpenAPI aún no incorporado (diferido intencionalmente).
- La migración SQL (`infra/db/migrations/001_create_identity_tables.sql`) debe aplicarse manualmente antes de usar identidad en producción.
- `appsettings.Development.json` tiene un `SecretKey` de desarrollo. En producción debe sobrescribirse via variable de entorno `Auth__SecretKey`.
- `POST /api/v1/auth/dev/token` solo funciona en `Development`. No hay protección adicional aparte del entorno.
- `next build` falla con `TypeError: generate is not a function` en Next.js 16.0.10 en este entorno Windows. Este error es pre-existente: también afecta a `apps/web-store` que no fue modificada. El typecheck (`tsc --noEmit`) pasa sin errores. Posible incompatibilidad de Next.js 16 con alguna dependencia del entorno.
- El token en cookie no es `httpOnly`, por lo que es legible desde JS (intencional para dev; en producción se debe usar httpOnly + refresh token).
- La protección de rutas en middleware es superficial (verifica existencia de la cookie, no valida el JWT en sí). Suficiente para fase de desarrollo.

## Validaciones ejecutadas (todas las tareas)
- `dotnet build apps/api/TiendaOnline.Api.slnx` → 0 errores, 0 advertencias ✓
- `dotnet test apps/api/TiendaOnline.Api.slnx` → 7/7 correctos ✓
- Auth tests: 401 sin token, 200 Admin, 403 Customer, 403 Staff ✓
- Smoke tests: /health 200, /api/v1/system/info 200 ✓
- `npm install --workspace=apps/web-admin` → correcto ✓
- `tsc --noEmit` en `apps/web-admin` → 0 errores, 0 advertencias ✓
- `next build` en `apps/web-admin` → falla (pre-existente, ver riesgos) ⚠
- `next build` en `apps/web-store` (sin modificar) → mismo error, confirma que es pre-existente ⚠

## Siguientes pasos recomendados
- Investigar y resolver el error pre-existente de `next build` (`TypeError: generate is not a function`) en Next.js 16.0.10. Podría requerir actualizar dependencias o cambiar de versión.
- Aplicar migración SQL: `infra/db/migrations/001_create_identity_tables.sql`.
- Agregar hash de contraseñas (BCrypt) cuando se implemente el registro real.
- Introducir OpenAPI (Swashbuckle o soporte nativo .NET) cuando haya endpoints de negocio.
- Implementar módulo de autenticación completo (registro, login real con hash de contraseña).
- Definir ADR para contratos compartidos entre API, web y mobile.
- Empezar estructura de bounded contexts del dominio (Catalog, Customers) sin lógica compleja.
- Mantener el enfoque en Fase 1; no adelantar catálogo, carrito, checkout, pagos reales ni FEL real.
- Cuando se implemente auth real: migrar cookie a httpOnly + refresh token.
- Considerar `packages/api-client` como capa compartida cuando web-store también necesite cliente HTTP.
