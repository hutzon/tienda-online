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

### Tarea 6: Integración Real de Catálogo, Inventario y Pedidos

- Se conectó `web-store` a los endpoints reales de catálogo `/api/v1/catalog/products` reemplazando los placeholders.
- Se implementó un flujo base de creación de pedidos en el carrito `web-store/cart` hacia `/api/v1/orders`.
- Se implementaron las pantallas funcionales en `web-admin` para listar/crear productos, actualizar inventario y listar pedidos consumiendo `/api/v1/admin/*`.
- Se corrigieron errores de navegación nullable en EF Core 8+ (`Product.Category`, `Product.OrderItems`, etc.) que fallaban al guardar entidades desconectadas.
- Se aseguraron los flujos y tests de integración en `TiendaOnline.Api.Tests`.

### Tarea 7: Flujo de Checkout y Pagos Base

- Se estructuró el dominio separando `CheckoutSession`, `PaymentAttempt` y `Order` en el backend.
- Se implementaron flujos de simulación de pago online y contra entrega.
- Se reestructuró el carrito de `web-store` para invocar la creación de sesión y fluir hacia el checkout interactivo.
- Se construyó `CheckoutPage` (`app/checkout/[sessionId]/page.tsx`) con 3 pasos (información, método de pago, simulación).
- Se expandió `OrdersView` en `web-admin` para mostrar los datos de contacto y el estado de la transacción de pago de las órdenes.

### Tarea 8: Flujo de Facturación y Mock FEL/SAT

- Se separó conceptualmente la "Orden" del "Documento Fiscal" mediante las entidades `Invoice` e `InvoiceLine`.
- Se introdujo una abstracción `IFelProvider` para facilitar el reemplazo futuro por un certificador real.
- Se implementó `MockFelProvider` usando `HttpClient` y autenticación base para interactuar con el servicio local `FelSatMock`.
- Se creó `BillingEndpoints` con soporte para emisión asíncrona o manual y consulta.
- Se actualizaron las interfaces de `web-admin` para permitir al administrador "Emitir Factura (Mock)" sobre órdenes confirmadas, visualizando su estado y UUID.
- Se actualizó el frontend público en `web-store/checkout/[sessionId]/success` para informar del estado de la facturación al cliente.

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

## Decisiones vigentes adicionales

- `proxy.ts` en Next.js 16 es la convención de middleware (equivale a `middleware.ts` de versiones anteriores). No crear `middleware.ts`.
- Todos los íconos son SVG inline propios sin dependencias externas — fácil de reemplazar.
- Placeholders visuales en ProductCard son temporales y no representan branding final.
- El middleware de correlación (`X-Correlation-Id`) es una convención de trazabilidad mínima en el backend.

## Archivos creados o modificados en la tarea actual

- `apps/api/src/TiendaOnline.Api/Modules/Checkout/CheckoutEndpoints.cs` — validaciones qty y customer
- `apps/api/src/TiendaOnline.Api/Middleware/GlobalExceptionHandler.cs` — IWebHostEnvironment + correlationId
- `apps/api/src/TiendaOnline.Api/Program.cs` — correlation ID middleware + request logging
- `apps/api/tests/TiendaOnline.Api.Tests/Commerce/CommerceFlowTests.cs` — 2 tests nuevos
- `apps/web-admin/components/admin/Icons.tsx` — nuevo (8 iconos SVG)
- `apps/web-admin/components/admin/Sidebar.tsx` — iconos actualizados + entrada facturación
- `apps/web-store/components/storefront/Icons.tsx` — nuevo (4 iconos SVG)
- `apps/web-store/components/storefront/PublicHeader.tsx` — iconos en navegación
- `apps/web-store/components/storefront/ProductCard.tsx` — placeholder visual mejorado
- `docs/handoffs/2026-05-13_hardening_observabilidad_qa.md` — handoff completo
- `PROJECT_MEMORY.md` — actualizado

## Archivos creados o modificados en tareas anteriores

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
- `apps/web-store/app/checkout/[sessionId]/page.tsx`
- `apps/web-store/app/checkout/[sessionId]/success/page.tsx`
- `apps/api/src/TiendaOnline.Api/Modules/Checkout/CheckoutEndpoints.cs`
- `apps/api/src/TiendaOnline.Api/Modules/Payments/PaymentEndpoints.cs`
- `apps/api/src/TiendaOnline.Api/Modules/Billing/BillingEndpoints.cs`
- `apps/api/src/TiendaOnline.Api/Modules/Billing/Providers/IFelProvider.cs`
- `apps/api/src/TiendaOnline.Api/Modules/Billing/Providers/MockFelProvider.cs`
- `docs/handoffs/2026-04-25_mock_fel_facturacion.md`
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

### Tarea 9: Hardening, Observabilidad, QA y Mejora Visual

- Verificado que `proxy.ts` en Next.js 16 es la convención correcta de middleware (no `middleware.ts`).
- Confirmado que el login admin funciona correctamente; el "Failed to fetch" histórico era por backend no corriendo.
- Agregada validación de cantidad > 0 y validación completa de datos de cliente en `CheckoutEndpoints.cs`.
- Mejorado `GlobalExceptionHandler.cs` para usar `IWebHostEnvironment` vía DI y propagar `correlationId`.
- Agregado middleware de correlación en `Program.cs`: genera/propaga `X-Correlation-Id` y loguea cada request con método, ruta, status y duración.
- Agregados 2 tests nuevos: flujo de pago online simulado y validación de cantidad cero. Total: 15/15.
- Creados archivos de íconos SVG inline en `web-admin` y `web-store` (sin dependencias externas).
- Actualizado `Sidebar.tsx` con iconos específicos por sección y entrada de Facturación.
- Mejorado `ProductCard.tsx` con placeholder visual accesible (SVG + aria-label).
- Actualizado `PublicHeader.tsx` con iconos en navegación.

## Riesgos o pendientes

- `/health/ready` depende de PostgreSQL y Redis activos; si Docker Desktop no está iniciado, no puede validarse.
- El warning `baseline-browser-mapping` aparece en builds web, pero no bloquea el resultado.
- 12 warnings CS8602 (nullable references) pre-existentes en CatalogEndpoints/InventoryEndpoints/OrderEndpoints — no bloqueantes.
- OpenAPI sigue diferido.
- Las migraciones SQL en `infra/db/migrations/` siguen siendo manuales.
- La cookie `admin_token` sigue siendo JavaScript-accessible (no `httpOnly`) — aceptable en Development.
- La entrada `/billing` del Sidebar admin no tiene página propia aún — pendiente para siguiente ciclo.
- Los placeholders visuales deben reemplazarse con assets reales cuando haya identidad de marca.

## Siguientes pasos recomendados

- Crear `app/(admin)/billing/page.tsx` para dar destino a la entrada de Facturación en Sidebar.
- Hardening de cookie `admin_token` a `httpOnly` vía API route cuando se acerque a producción.
- Aplicar migraciones SQL antes de trabajar con persistencia real.
- Agregar OpenAPI cuando el catálogo de endpoints estabilice.
- Introducir autenticación real de clientes y hardening de cookies en fases posteriores.
- Planificar transición de `/auth/dev/token` a autenticación real con usuarios en DB.
- Mantener fuera del alcance pagos reales, SAT/FEL real y branding final.
