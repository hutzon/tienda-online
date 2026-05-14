# Handoff: Validación con Docker, PostgreSQL, Redis y Persistencia Real (Prompt 11 — 2026-05-13)

## Contexto recibido

- Prompt 10 completado (commit 85bf2c9): pruebas E2E con InMemory DB.
- Prompt 11: levantar el stack completo con Docker (PostgreSQL + Redis), corregir las migraciones para que funcionen con EF Core real, y validar persistencia entre reinicios.

## Bugs encontrados y corregidos

### Bug 1: Puerto 5432 ocupado por PostgreSQL local de Windows

- **Síntoma**: El contenedor Docker mostraba `5432/tcp` sin binding de host; Npgsql devolvía `28P01: password auth failed`.
- **Causa raíz**: Una instalación local de PostgreSQL en Windows ya ocupaba el puerto 5432. Docker no podía hacer el bind.
- **Fix**: Cambiar `docker-compose.yml` a `5433:5432`. Actualizar `appsettings.json` a `Port=5433`.
- **Lección**: En Windows con PostgreSQL local instalado, siempre usar un puerto alternativo para Docker (5433, 5434, etc.).

### Bug 2: Convención de nombres PascalCase vs snake_case en EF Core + PostgreSQL

- **Síntoma**: Todas las queries EF Core fallaban con column not found porque EF Core generaba `"Id"`, `"OrderId"`, etc., pero la migración 002 creó columnas `id`, `order_id`, etc.
- **Causa raíz**: EF Core (sin configuración) usa los nombres de las propiedades C# directamente como nombres de columna (PascalCase). Las migraciones SQL manuales usaban snake_case.
- **Fix**: Agregar paquete `EFCore.NamingConventions 9.0.0` y configurar `options.UseSnakeCaseNamingConvention()` en ambos contextos.
- **Afectado**: `AppCommerceContext` (en `CommerceExtensions.cs`) y `AppIdentityContext` (en `IdentityExtensions.cs`).

### Bug 3: Migración 003 con FK que referenciaba columna inexistente

- **Síntoma**: `column "Id" referenced in foreign key constraint does not exist` en migration 003.
- **Causa raíz**: La migración 003 usaba nombres de columna PascalCase con comillas (`"Id"`, `"OrderId"`) siendo FK hacia la tabla `orders` cuya clave primaria es `id` (snake_case de migración 002).
- **Fix**: Reescribir migración 003 completamente en snake_case.

### Bug 4: Migración 002 incompleta

- **Síntoma**: Tablas `checkout_sessions` y `payment_attempts` no existían en la base de datos real.
- **Causa raíz**: Cuando se implementaron esas entidades (Tarea 7), no se actualizó la migración 002.
- **Fix**: Reescribir migración 002 completa con todas las tablas actuales más columnas `phone` y `address` en `orders` (agregadas en Tarea 9).

## Cambios de código

| Archivo | Cambio |
|---|---|
| `docker-compose.yml` | PostgreSQL expuesto en `5433:5432` (era `5432:5432`) |
| `apps/api/src/TiendaOnline.Api/appsettings.json` | `Port=5433` en connection string |
| `apps/api/src/TiendaOnline.Api/TiendaOnline.Api.csproj` | Paquete `EFCore.NamingConventions 9.0.0` agregado |
| `apps/api/src/TiendaOnline.Api/Identity/IdentityExtensions.cs` | `options.UseSnakeCaseNamingConvention()` en `AddDbContext` |
| `apps/api/src/TiendaOnline.Api/Modules/Commerce/CommerceExtensions.cs` | `options.UseSnakeCaseNamingConvention()` en `AddDbContext` |
| `infra/db/migrations/002_create_commerce_tables.sql` | Reescrito completo: añade `checkout_sessions`, `payment_attempts`, `phone`, `address` en `orders` |
| `infra/db/migrations/003_create_billing_tables.sql` | Reescrito en snake_case con FK correcta |

## Validaciones ejecutadas (Prompt 11)

| Validación | Resultado |
|---|---|
| `docker compose ps` | postgres (5433) y redis (6379) → `healthy` |
| `dotnet test` | 15/15 pasando (InMemory) |
| API con PostgreSQL real | Arranque OK, 3 migraciones aplicadas |
| `/health` | `Healthy` con PostgreSQL real |
| `/health/ready` | `Healthy` (PostgreSQL + Redis) |
| Catálogo | 3 productos desde seed de PostgreSQL |
| Checkout CashOnDelivery | `Confirmed` ✅ |
| Checkout OnlineSimulated + pago | `PendingPayment → Paid → Confirmed` ✅ |
| Factura mock FEL | `Emitted`, UUID generado ✅ |
| Persistencia entre reinicios | Datos sobreviven (factura recuperada) ✅ |
| 2do arranque de API | Migraciones y seed skipped correctamente ✅ |

## Decisiones operacionales clave

### Puerto 5433 para Docker PostgreSQL
En este entorno existe PostgreSQL local en el puerto 5432. El Docker usa 5433. Esta decisión está codificada en `docker-compose.yml` y `appsettings.json`.

### EFCore.NamingConventions
El paquete v9.0.0 es compatible con Npgsql 9.0.3. No se puede usar v10.0.1 porque Npgsql 9.x requiere EF Core 9.x.

### Volumen de datos
El volumen Docker `tienda-online_postgres_data` fue eliminado durante la corrección para inicializar la DB limpia. El volumen se llama `tienda-online_postgres_data`.

### Redis — solo health check por ahora
Redis está funcionando y `/health/ready` lo verifica. Aún no se usa para cache ni sesiones en la lógica de negocio.

## Comandos para levantar el stack completo

```powershell
# 1. Docker (desde raíz del monorepo)
docker compose up -d

# 2. API con PostgreSQL real
dotnet run --project apps/api/src/TiendaOnline.Api/TiendaOnline.Api.csproj --urls http://localhost:8080

# 3. Mock FEL (necesario para emitir facturas)
dotnet run --project mocks/fel-sat-mock/FelSatMock.Api.csproj --urls http://localhost:5153

# 4. Frontends
npm run dev -w @tienda-online/web-store   # puerto 3000
npm run dev -w @tienda-online/web-admin   # puerto 3001
```

## Recomendaciones para el siguiente agente

1. **Puerto 5433**: La connection string usa 5433, no 5432. Si se cambia el `docker-compose.yml` de vuelta a 5432 se debe actualizar `appsettings.json` también.
2. **Sin datos en producción**: El volumen fue recreado. Si se levantan los servicios, habrá datos de seed (3 productos). Las facturas/órdenes previas ya no existen.
3. **EFCore.NamingConventions**: Si se actualiza Npgsql a v10.x, también actualizar `EFCore.NamingConventions` a v10.x y resolver la dependencia de EF Core Relational.
4. **Redis funcional**: El siguiente paso de negocio puede usar Redis para cache de catálogo o sesiones de carrito.
5. **OpenAPI pendiente**: Con PostgreSQL real validado, tiene sentido agregar Swagger/OpenAPI en el próximo ciclo.
