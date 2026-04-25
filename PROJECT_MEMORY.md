# PROJECT MEMORY - TiendaOnline

## Objetivo del proyecto

Construir una tienda online profesional con:
- web pública
- app móvil
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
- `Microsoft.AspNetCore.Authentication.JwtBearer` en .NET 10 debe agregarse como paquete NuGet explícito.
- Identidad gestionada con modelo simple (`AppUser` + rol como string), sin ASP.NET Core Identity completo.
- Migraciones SQL manuales en `infra/db/migrations/`.
- `.gitignore` revisado y correcto para el monorepo actual.
- `web-admin` protege rutas con `proxy.ts` de Next.js 16.
- `apps/api` incluye `Properties/launchSettings.json` para forzar `ASPNETCORE_ENVIRONMENT=Development` en `dotnet run` local.
- El error histórico `TypeError: generate is not a function` no fue reproducible en la validación actual.
- El warning vigente de compilación web es `baseline-browser-mapping` desactualizado; no bloquea build ni ejecución.

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

### Tarea 3: Base de autenticación y autorización

- Se agregaron `Microsoft.AspNetCore.Authentication.JwtBearer 10.0.3` y `Npgsql.EntityFrameworkCore.PostgreSQL 9.0.3`.
- Se implementaron `AuthOptions`, `AppRoles`, `AppPolicies` y `AuthExtensions` con JWT Bearer.
- Se crearon entidades de identidad: `AppUser` y `AppIdentityContext`.
- Se creó `IdentityExtensions` para registro del DbContext.
- Se creó endpoint protegido `GET /api/v1/admin/ping`.
- Se creó endpoint de desarrollo `POST /api/v1/auth/dev/token`.
- Se creó migración SQL en `infra/db/migrations/001_create_identity_tables.sql`.
- Se agregaron tests de autorización para 401, 200 Admin y 403 por rol incorrecto.

### Tarea 4: Base administrativa inicial

- Se construyó la estructura administrativa en `apps/web-admin`.
- Se agregó cliente API con manejo de token, errores y configuración por variables de entorno.
- Se implementó sesión de desarrollo con cookie `admin_token`.
- Se construyó login de desarrollo, dashboard y placeholders para catálogo, inventario, pedidos, clientes y settings.
- Se migró la protección de rutas de `middleware.ts` a `proxy.ts` por compatibilidad con Next.js 16.
- Se corrigió el build de `/login` envolviendo `useSearchParams()` en `Suspense`.

### Tarea 5: Base inicial del storefront web

- Se construyó la base pública en `apps/web-store` con layout, header, footer y estilos propios.
- Se crearon rutas base: `/`, `/catalog`, `/product/[slug]`, `/cart` y `/account`.
- Se agregaron placeholders tipados para catálogo, detalle de producto, carrito y cuenta.
- Se implementó una capa simple de consumo API con `apiFetch`, manejo básico de errores y configuración por variables de entorno.
- La home muestra estado de conexión hacia `/api/v1/system/info` y datos del backend cuando la API está disponible.
- Se dejó la estructura lista para crecer sin mezclar storefront y admin.

## Estructura relevante actual

```text
apps/api/
  src/
    TiendaOnline.Api/
      Auth/
      Configuration/
      Endpoints/
      Identity/
      Infrastructure/
      Middleware/
      Modules/
      Properties/
        launchSettings.json
      Program.cs
      appsettings.json
      appsettings.Development.json
  tests/
    TiendaOnline.Api.Tests/

apps/web-admin/
  app/
    (admin)/
    login/
      LoginView.tsx
      page.tsx
  components/admin/
  lib/
  proxy.ts

apps/web-store/
  app/
    account/page.tsx
    cart/page.tsx
    catalog/page.tsx
    product/[slug]/page.tsx
    globals.css
    layout.tsx
    loading.tsx
    not-found.tsx
    page.tsx
  components/storefront/
    ApiConnectionCard.tsx
    ProductCard.tsx
    PublicFooter.tsx
    PublicHeader.tsx
    StorefrontContainer.tsx
  lib/
    api/
      client.ts
      system.ts
    catalog.ts
```

## Endpoints disponibles

- `GET /health` → liveness.
- `GET /health/ready` → readiness contra PostgreSQL y Redis.
- `GET /api/v1/system/info` → nombre, versión, entorno y timestamp.
- `GET /api/v1/admin/ping` → requiere JWT con rol `Admin`.
- `POST /api/v1/auth/dev/token` → genera JWT de desarrollo solo en `Development`.

## Archivos creados o modificados en la tarea actual

- `apps/api/src/TiendaOnline.Api/Properties/launchSettings.json`
- `apps/web-admin/app/login/LoginView.tsx`
- `apps/web-admin/app/login/page.tsx`
- `apps/web-admin/proxy.ts`
- `apps/web-store/.env.example`
- `apps/web-store/app/layout.tsx`
- `apps/web-store/app/page.tsx`
- `apps/web-store/app/catalog/page.tsx`
- `apps/web-store/app/product/[slug]/page.tsx`
- `apps/web-store/app/cart/page.tsx`
- `apps/web-store/app/account/page.tsx`
- `apps/web-store/app/loading.tsx`
- `apps/web-store/app/not-found.tsx`
- `apps/web-store/app/globals.css`
- `apps/web-store/components/storefront/*`
- `apps/web-store/lib/api/*`
- `apps/web-store/lib/catalog.ts`
- `docs/00_arranque_tecnico.md`
- `docs/01_setup_local.md`
- `README.md`
- `docs/handoffs/2026-04-25_storefront_base.md`
- `PROJECT_MEMORY.md`

## Validaciones ejecutadas

- `npm run typecheck -w @tienda-online/web-store` → correcto.
- `npm run typecheck -w @tienda-online/web-admin` → correcto.
- `npm run build -w @tienda-online/web-store` → correcto.
- `npm run build -w @tienda-online/web-admin` → correcto.
- `dotnet run --project apps/api/src/TiendaOnline.Api/TiendaOnline.Api.csproj` → `/health` 200.
- `GET http://127.0.0.1:8080/api/v1/system/info` → 200 con `environment: Development`.
- `npm run start -w @tienda-online/web-store` → `/`, `/catalog`, `/product/starter-office-kit`, `/cart` y `/account` responden 200.
- Home de `web-store` validada consumiendo datos reales de `/api/v1/system/info`.

## Riesgos o pendientes

- `/health/ready` depende de PostgreSQL y Redis activos; si Docker Desktop no está iniciado, no puede validarse.
- El warning `baseline-browser-mapping` aparece en builds web, pero no bloquea el resultado.
- OpenAPI sigue diferido.
- La migración SQL `infra/db/migrations/001_create_identity_tables.sql` sigue siendo manual.
- La cookie `admin_token` sigue siendo de desarrollo y no es `httpOnly`.

## Siguientes pasos recomendados

- Conectar `web-store` a contratos compartidos cuando exista el primer módulo real de catálogo.
- Aplicar la migración SQL de identidad antes de trabajar persistencia real.
- Agregar OpenAPI cuando aparezcan endpoints de negocio.
- Introducir autenticación real de clientes y hardening de cookies en fases posteriores.
- Mantener fuera del alcance por ahora catálogo real, carrito real, checkout, pagos y FEL real.
