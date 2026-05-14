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

## Archivos creados o modificados en la tarea actual

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

- Fase 13: CRUD real de categorías y soporte de marcas.
- Fase 14: Inventario por lotes (Supplier, PurchaseOrder, InventoryLot).
- Fase 15: Serialización de unidades (InventoryUnit con serial único).
- Fase 16: Movimientos de inventario y descuento automático al confirmar compra.
- Fase 17: Mejora operativa del admin (filtros, búsquedas, resúmenes).
- Fase 18: Pruebas funcionales reales completas.
- Migrar almacenamiento de imágenes a S3/CDN cuando se acerque a producción.
- Implementar uso real de Redis: cache de catálogo, sesiones de carrito o rate limiting.
- Hardening de cookie `admin_token` a `httpOnly` vía API route.
- Agregar OpenAPI/Swagger.
- Introducir autenticación real de clientes en el storefront.
