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
- .NET SDK fijado: `10.0.102` (actualizado desde `10.0.103` — SDK disponible en el entorno actual).
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

### Tarea 11: Validación con Docker, PostgreSQL, Redis y Persistencia Real

- Identificado conflicto de puerto: PostgreSQL local de Windows ocupa 5432 → Docker usa 5433.
- Reescrita migración 002 completa: incluye `checkout_sessions`, `payment_attempts`, columnas `phone`/`address` en `orders`.
- Reescrita migración 003 en snake_case (antes usaba columnas PascalCase que no existían en DB).
- Agregado paquete `EFCore.NamingConventions 9.0.0` para sincronizar EF Core con columnas snake_case.
- Configurado `options.UseSnakeCaseNamingConvention()` en `AppCommerceContext` y `AppIdentityContext`.
- Validado stack completo: 3 migraciones aplicadas, seed data, `/health` + `/health/ready` = Healthy.
- Validados flujos: CashOnDelivery, OnlineSimulated+pago, factura FEL mock.
- Confirmada persistencia: datos sobreviven entre reinicios de API.

### Tarea 12 — Gestión de Imágenes de Producto

- Entidad `ProductImage` creada con campos: id, productId, imageUrl, altText, sortOrder, isPrimary, createdAt.
- Relación 1:N entre `Product` y `ProductImage` configurada en EF Core.
- Migración SQL `004_add_product_images.sql` creada y aplicada automáticamente al iniciar.
- `ImageEndpoints.cs` creado con 5 endpoints: upload (POST), list admin (GET), list public (GET), set-primary (PUT), delete (DELETE).
- Almacenamiento local en `wwwroot/uploads/products/` con `PhysicalFileProvider` explícito en `Program.cs`.
- URL de imagen construida dinámicamente desde el request (scheme+host) en el upload — no almacenada con host fijo.
- Static files: `UseStaticFiles` con `PhysicalFileProvider` explícito + creación del directorio en startup.
- `.gitignore` actualizado para ignorar `*.jpg|png|webp|jpeg` en uploads, pero versionar `.gitkeep`.
- `CatalogEndpoints.cs` actualizado: `PublicCatalogProductSummary` incluye `primaryImageUrl`, `PublicCatalogProductDetail` incluye lista `images`, `AdminCatalogProductSummary` incluye `imageCount` y `primaryImageUrl`.
- `web-admin/lib/api/commerce.ts` actualizado: funciones `fetchProductImages`, `uploadProductImage`, `setPrimaryProductImage`, `deleteProductImage`.
- `CatalogView.tsx` actualizado: fila expandible por producto que muestra galería de imágenes, upload inline, set-primary y delete.
- `web-store/lib/api/commerce.ts` actualizado: `ProductImageDto` + `images` en `PublicCatalogProductDetail`.
- `ProductImageGallery.tsx` creado: componente client con carrusel (flechas), puntos de navegación, miniaturas y fallback SVG.
- `product/[slug]/page.tsx` actualizado: usa `ProductImageGallery` real con las imágenes del producto.

**Decisiones técnicas:**
- Almacenamiento local para desarrollo — diseñado para evolucionar a S3/CDN.
- Tipos permitidos: jpg, jpeg, png, webp. Límite: 5 MB.
- La primera imagen subida se marca automáticamente como principal.
- Al eliminar imagen principal, la siguiente por sortOrder se promueve automáticamente.
- Validaciones de tipo y tamaño en el endpoint backend.

## Archivos creados o modificados en tarea 15 (Prompt 12)

- `apps/web-store/app/catalog/page.tsx` — texto real, empty state profesional
- `apps/web-store/app/account/page.tsx` — rediseñado: "Área de clientes", 3 cards Próximamente
- `apps/web-store/app/not-found.tsx` — texto profesional, ícono SVG, sin placeholder developer
- `apps/web-store/app/loading.tsx` — texto neutro
- `apps/web-store/app/checkout/[sessionId]/page.tsx` — `params` como Promise + `use()`, CSS classes, error types corregidos
- `apps/web-store/app/checkout/[sessionId]/success/page.tsx` — `params` como Promise + `use()`, CSS classes, sin emoji
- `apps/web-store/app/globals.css` — clases checkout (layout, form, inputs, payment, simulate, success)
- `apps/web-store/next-env.d.ts` — generado por build producción (`.next/types/` en vez de `.next/dev/types/`)
- `apps/web-store/components/storefront/CartOrderBase.tsx` — **eliminado** (obsoleto)
- `docs/handoffs/2026-05-14_storefront_refinamiento.md` — nuevo

## Archivos creados o modificados en la tarea anterior (Tarea 12 — Imágenes)

- `apps/api/src/TiendaOnline.Api/Modules/Catalog/Entities/ProductImage.cs` — nuevo
- `apps/api/src/TiendaOnline.Api/Modules/Catalog/ImageEndpoints.cs` — nuevo
- `apps/api/src/TiendaOnline.Api/wwwroot/.gitkeep` — nuevo
- `apps/api/src/TiendaOnline.Api/wwwroot/uploads/products/.gitkeep` — nuevo
- `infra/db/migrations/004_add_product_images.sql` — nuevo
- `docs/EXECUTION_TRACKER.md` — nuevo (tracker maestro del plan)
- `apps/api/src/TiendaOnline.Api/Modules/Catalog/Entities/Product.cs` — modificado (Images nav)
- `apps/api/src/TiendaOnline.Api/Modules/Commerce/AppCommerceContext.cs` — modificado (DbSet + config)
- `apps/api/src/TiendaOnline.Api/Modules/Catalog/CatalogEndpoints.cs` — modificado (imágenes en responses)
- `apps/api/src/TiendaOnline.Api/Program.cs` — modificado (static files + MapImageEndpoints)
- `apps/web-admin/lib/api/commerce.ts` — modificado (image API functions)
- `apps/web-admin/app/(admin)/catalog/CatalogView.tsx` — modificado (image management UI)
- `apps/web-store/lib/api/commerce.ts` — modificado (ProductImageDto + images)
- `apps/web-store/components/storefront/ProductImageGallery.tsx` — nuevo
- `apps/web-store/app/product/[slug]/page.tsx` — modificado (gallery)
- `.gitignore` — modificado (uploads ignorados)
- `docs/handoffs/2026-05-13_imagenes_producto_galeria.md` — nuevo

## Archivos creados o modificados en tarea 11

- `docker-compose.yml` — PostgreSQL en `5433:5432` (local Windows usa 5432)
- `apps/api/src/TiendaOnline.Api/appsettings.json` — connection string `Port=5433`
- `apps/api/src/TiendaOnline.Api/TiendaOnline.Api.csproj` — `EFCore.NamingConventions 9.0.0`
- `apps/api/src/TiendaOnline.Api/Identity/IdentityExtensions.cs` — `UseSnakeCaseNamingConvention()`
- `apps/api/src/TiendaOnline.Api/Modules/Commerce/CommerceExtensions.cs` — `UseSnakeCaseNamingConvention()`
- `infra/db/migrations/002_create_commerce_tables.sql` — reescrito completo
- `infra/db/migrations/003_create_billing_tables.sql` — reescrito en snake_case
- `docs/handoffs/2026-05-13_docker_postgresql_redis_validacion.md` — handoff completo

## Archivos creados o modificados en tareas anteriores (9–10)

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

### Tarea 10: Pruebas Locales End-to-End y Fixes Post-Verificación

- Levantado backend con `Database__UseInMemoryForTesting=true` (env var) para desarrollo sin Docker.
- Levantado mock FEL/SAT en puerto 5153 (`dotnet run --urls http://localhost:5153`).
- Levantados web-store (3000) y web-admin (3001) en modo dev.
- Verificado flujo completo: catálogo → checkout CashOnDelivery → factura emitida.
- Verificado flujo completo: checkout OnlineSimulated → pago simulado exitoso → factura emitida.
- Verificado flujo login admin: dev token → JWT → admin ping → admin orders.
- Verificado correlación ID (`X-Correlation-Id`) en todos los responses del backend.
- Fix detectado: el Sidebar tenía link `/billing` sin página existente → creada `billing/page.tsx`.
- Fix detectado: ruta `/billing` no estaba en `PROTECTED_PREFIXES` de `proxy.ts` → agregada.
- Todos los tests y typechecks validados post-fix (15/15, builds limpios).

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

## Decisiones de arranque local

### Con Docker (PostgreSQL real — recomendado)
```powershell
docker compose up -d
dotnet run --project apps/api/src/TiendaOnline.Api/TiendaOnline.Api.csproj --urls http://localhost:8080
dotnet run --project mocks/fel-sat-mock/FelSatMock.Api.csproj --urls http://localhost:5153
npm run dev -w @tienda-online/web-store    # puerto 3000
npm run dev -w @tienda-online/web-admin    # puerto 3001
```

### Sin Docker (InMemory DB)
```powershell
$env:Database__UseInMemoryForTesting = "true"; dotnet run --project apps/api/...
```
- Los datos del InMemory DB se pierden al reiniciar el backend.

### Nota de puerto PostgreSQL
- En este entorno existe PostgreSQL local en Windows en puerto 5432.
- Docker PostgreSQL usa el puerto 5433 (`docker-compose.yml`: `5433:5432`).
- `appsettings.json` tiene `Port=5433` en la connection string.

### Tarea 16 (Prompt 13) — Diagnóstico y Corrección del Flujo de Checkout/Pago

**Causa raíz encontrada:**
- `PUT /api/v1/checkout/sessions/{id}/customer` devolvía `Results.Ok()` sin cuerpo (HTTP 200 con body vacío).
- `apiFetch` en el frontend llamaba `response.json()` incondicionalmente → `"Unexpected end of JSON input"`.

**Correcciones aplicadas:**
1. **Backend `CheckoutEndpoints.cs`**: cambiado `Results.Ok()` → `Results.Ok(new { updated = true })` para contrato explícito.
2. **Frontend `client.ts` (`apiFetch`)**: agregado manejo defensivo antes de `.json()`:
   - 204 No Content → retorna `undefined as T` directamente.
   - Body vacío → retorna `undefined as T` sin parsear.
   - Body con contenido → parsea con `JSON.parse(text)`.
3. **Frontend `commerce.ts` (`updateCheckoutCustomer`)**: tipo correcto `apiFetch<{ updated: boolean }>` en vez de `apiFetch<void>`.

**Decisiones técnicas:**
- Fix doble (backend + frontend): el backend es ahora explícito en su contrato; el frontend es defensivo ante respuestas vacías o 204 de cualquier endpoint futuro.
- `JSON.parse(text)` en lugar de `response.json()`: permite verificar que el body no esté vacío antes de parsear.
- No se usó `Results.NoContent()` (204) porque la convención del proyecto es 200 + JSON en todos los endpoints mutables.

**Pruebas manuales realizadas (2026-05-15):**
- Servicios: Docker (PG 5433, Redis 6379), API http://localhost:8080, web-store http://localhost:3000.
- PUT /customer → 200 `{"updated":true}` ✓ (antes fallaba con body vacío).
- Flujo CashOnDelivery completo: crear sesión → update customer → payment method → session Completed ✓.
- Flujo OnlineSimulated completo: crear sesión → update customer → payment method → simulate → Paid/Confirmed ✓.
- Success page /checkout/{id}/success → 200 ✓.
- Todas las rutas principales → 200 ✓.

**Archivos modificados en esta tarea:**
- `apps/api/src/TiendaOnline.Api/Modules/Checkout/CheckoutEndpoints.cs` — `Results.Ok()` → `Results.Ok(new { updated = true })`
- `apps/web-store/lib/api/client.ts` — `apiFetch` defensivo ante body vacío y 204
- `apps/web-store/lib/api/commerce.ts` — tipo correcto en `updateCheckoutCustomer`
- `docs/handoffs/2026-05-15_fix_checkout_json_parse.md` — nuevo

**Validaciones ejecutadas:**
- `dotnet build` API → 0 errores ✓
- `dotnet test` 15/15 ✓
- `npm run typecheck -w @tienda-online/web-store` → sin errores ✓
- `npm run build -w @tienda-online/web-store` → limpio ✓

### Tarea 15 (Prompt 12) — Refinamiento Visual del Storefront y Pruebas desde la Web con Docker

**Contexto de arranque:** Docker disponible (PostgreSQL en 5433, Redis en 6379). Stack completo corriendo.

**Hallazgos antes de corregir:**
- `catalog/page.tsx`: texto de placeholder developer-facing ("Catálogo base listo para conectar datos reales") visible en producción.
- `account/page.tsx`: placeholder muy developer-facing ("Cuenta placeholder", "Acceso y perfil del cliente aún no implementados").
- `not-found.tsx`: texto de placeholder ("inicio, catálogo, detalle placeholder, carrito y cuenta placeholder") visible en el RSC flight data.
- `loading.tsx`: texto de placeholder ("Cargando storefront", "Preparando experiencia pública…").
- `checkout/[sessionId]/page.tsx` y `success/page.tsx`: type `params: { sessionId: string }` — incorrecto para Next.js 15/16; causa que `.next/dev/types/validator.ts` quede corrupto y rompa `tsc --noEmit`.
- `.next/dev/types/validator.ts`: corrupto por el tipo de params incorrecto → bloqueaba typecheck completo.
- `CartOrderBase.tsx`: componente legado sin uso activo (reemplazado por CartContext + CartView).
- Checkout page usaba inline styles crudos inconsistentes con el CSS del storefront.
- Success page usaba emoji 🎉 y estilos crudos inconsistentes.

**Correcciones aplicadas:**
1. Eliminado `.next` corrupto; corregido `params` en checkout y success a `Promise<{sessionId}>` + `use(params)`.
2. Catálogo: h1 "Todos los productos", se eliminó párrafo placeholder, se agregó empty-state profesional.
3. Cuenta: página presentable con "Área de clientes", 3 info-cards "Próximamente", CTAs a catálogo y carrito.
4. `not-found.tsx`: texto profesional con ícono SVG, sin referencias a rutas internas ni placeholders.
5. `loading.tsx`: texto neutro "Un momento…".
6. `CartOrderBase.tsx`: eliminado (no usado, reemplazado por CartContext en tarea 14).
7. Checkout page: migrado a CSS classes (`checkout-layout`, `form-group`, `form-input`, `payment-option`, etc.) consistentes con el resto del storefront.
8. Success page: migrado a CSS classes (`success-section`, `success-icon`, `success-details`, `success-detail-row`), sin emoji, con ícono SVG.

**Decisiones técnicas:**
- `React.use(params)` para unwrap de Promise en client components de Next.js 15/16.
- CSS classes añadidas a `globals.css` para checkout y success — evita inline styles y es consistente.
- La extensión del CSS fue mínima (no hay hojas de estilo adicionales, todo en `globals.css`).

**Pruebas manuales realizadas (2026-05-14):**
- Servicios: Docker PostgreSQL (5433) + Redis (6379), API en http://localhost:8080, web-store en http://localhost:3000.
- `GET /` → 200 | eyebrow "Bienvenido" ✓ | hero text ✓ | "Carry Everyday Backpack" cargado ✓.
- `GET /catalog` → 200 | "Todos los productos" ✓ | placeholder viejo eliminado ✓ | 5 productos visibles ✓.
- `GET /product/carry-everyday-backpack` → 200 | precio GTQ ✓ | CTA "Agregar al carrito" ✓ | imagen real ✓.
- `GET /cart` → 200 | empty state correcto ✓.
- `GET /account` → 200 | "Área de clientes" ✓ | placeholder viejo eliminado ✓ | "Próximamente" ✓.
- `GET /api/v1/catalog/products` → 200 | 5 productos seed con imágenes.
- `POST /api/v1/checkout/sessions` (2 items) → 200 | session.id ✓ | totales GTQ 1029.00 ✓.
- `PUT /api/v1/checkout/sessions/{id}/customer` → 200 ✓.
- `POST /api/v1/checkout/sessions/{id}/payment-method` (CashOnDelivery) → 200 | orderStatus=Confirmed ✓.
- Flujo OnlineSimulated completo → paymentStatus=Paid | orderStatus=Confirmed ✓.
- `GET /checkout/{sid}/success` → 200 ✓.
- `typecheck web-store` → sin errores ✓.
- `build web-store` → limpio, 8 rutas optimizadas ✓.
- `typecheck web-admin` → sin errores ✓.

**Limitaciones:**
- Interacciones DOM (clicks, localStorage) requieren navegador real — validadas a nivel SSR+API.
- El warning `baseline-browser-mapping` persiste en builds — no bloquea.

### Tarea 14 — Refinamiento del Storefront, Carrito Real y Pruebas desde la Web

**Hallazgos antes de corregir:**
- Carrito era un placeholder con `CartOrderBase` — seleccionaba 1 producto desde un `<select>` y creaba un checkout directo. Sin estado real.
- ProductCard y detalle de producto no tenían botón "Agregar al carrito".
- Home mostraba texto placeholder: "Storefront Base", "Sin lógica de negocio".
- Footer decía "Sin branding definitivo ni lógica comercial real".
- Header no mostraba conteo de items en carrito.
- `global.json` pedía `10.0.103` pero el SDK disponible es `10.0.102`.
- `appsettings.Development.json` no existía → API fallaba con `IDX10703: key length is zero` al no tener JWT secret configurado.

**Decisiones técnicas:**
- Carrito implementado como `CartContext` (React Context + `useReducer`) con persistencia `localStorage`.
- `CartProvider` envuelve el layout raíz → todo el árbol accede al carrito sin prop drilling.
- `PublicHeader` convertido a `'use client'` para mostrar el badge dinámico de carrito.
- `AddToCartButton` es client component reutilizable — variante `card` para tarjetas, variante `detail` para página de producto.
- `CartView` es client component con lista de items, control de cantidades, eliminar, vaciar, y botón de checkout.
- El checkout crea una sesión con todos los items del carrito y redirige a `/checkout/[sessionId]`.
- `appsettings.Development.json` creado con JWT secret local y `UseInMemoryForTesting: true` — ya estaba en `.gitignore`.
- `global.json` actualizado de `10.0.103` a `10.0.102` con `rollForward: latestFeature`.

**Flujo funcional implementado:**
1. Catálogo → "Agregar" en tarjeta → badge se actualiza en header.
2. Detalle de producto → "Agregar al carrito" → feedback inmediato → badge actualiza.
3. Carrito → lista con cantidades editables → eliminar individual → vaciar todo → total recalcula.
4. Carrito → "Proceder al checkout" → crea sesión → redirige a `/checkout/[sessionId]`.

**Pruebas manuales realizadas desde navegador/HTTP:**
- Servicios levantados: API en `http://localhost:8080`, web-store en `http://localhost:3000`.
- GET / → 200, "Bienvenido" visible, 3 productos del seed cargados.
- GET /catalog → 200, 3 productos con botón "Agregar" visible.
- GET /product/carry-everyday-backpack → 200, precio 425, CTA "Agregar al carrito", breadcrumb.
- GET /product/smart-desk-light → 200.
- GET /product/starter-office-kit → 200.
- GET /cart → 200, estado vacío correcto, eyebrow "carrito de compras".
- GET /account → 200.
- POST /api/v1/checkout/sessions con 2 units → 200, session creada, order creado.
- GET /checkout/[sessionId] → 200.
- API /health → 200 Healthy.
- API /api/v1/catalog/products → 200, 3 productos seed.

**Limitaciones encontradas:**
- Las pruebas de interacción (clicks, localStorage) requieren navegador real — validadas a nivel de SSR/API.
- `node_modules` no existían al inicio de la sesión → `npm install --engine-strict=false` requerido (Node 20.19.6 < 22.13.1 requerido).

## Riesgos o pendientes

- El warning `baseline-browser-mapping` aparece en builds web, pero no bloquea el resultado.
- 12+ warnings CS8602 (nullable references) pre-existentes — no bloqueantes.
- OpenAPI sigue diferido.
- Las migraciones SQL en `infra/db/migrations/` siguen siendo manuales (no EF Core Migrations).
- La cookie `admin_token` sigue siendo JavaScript-accessible (no `httpOnly`) — aceptable en Development.
- Redis funcionando pero no usado en lógica de negocio aún (solo health check).
- Las imágenes de producto se almacenan localmente en `wwwroot/uploads/products/` — no productivo.
- Los placeholders visuales deben reemplazarse con assets reales cuando haya identidad de marca.

## Siguientes pasos recomendados

- Fase 15: Inventario por lotes (Supplier, PurchaseOrder, InventoryLot).
- Fase 16: Serialización de unidades (InventoryUnit con serial único).
- Fase 17: Movimientos de inventario y descuento automático al confirmar compra.
- Fase 18: Mejora operativa del admin (filtros, búsquedas, resúmenes).
- Pruebas funcionales completas con navegador real (Playwright o manual).
- Migrar almacenamiento de imágenes a S3/CDN cuando se acerque a producción.
- Implementar uso real de Redis: cache de catálogo o rate limiting.
- Hardening de cookie `admin_token` a `httpOnly` vía API route.
- Agregar OpenAPI/Swagger.
- Introducir autenticación real de clientes en el storefront.
- Persistir items del carrito en el backend (Redis o DB) para sesiones cross-device.
- Agregar filtros de búsqueda/categoría en el catálogo público.
