# 01. Setup local y validación base

## Objetivo

Documentar el arranque local real del monorepo después del scaffolding inicial, la base web actual y las validaciones ejecutadas.

## Versiones fijadas

- Package manager: `npm 11.6.4`
- Workspace strategy: `npm workspaces`
- Node.js: `22.13.1`
- .NET SDK: `10.0.103`
- Backend target framework: `net10.0`
- PostgreSQL local: `17-alpine`
- Redis local: `7.4-alpine`
- Web storefront: Next.js `16.0.10`
- Web admin: Next.js `16.0.10`
- Mobile: Expo `55.0.0`
- React Native: `0.83.0`

## Estructura activa

- `apps/web-store`: storefront público base.
- `apps/web-admin`: panel administrativo base.
- `apps/mobile-app`: bootstrap Expo.
- `apps/api`: backend ASP.NET Core.
- `mocks/fel-sat-mock`: mock oficial FEL/SAT.

## Convenciones confirmadas

- `npm workspaces` se mantiene como estrategia de monorepo.
- El mock FEL/SAT oficial vive en `mocks/fel-sat-mock/`.
- Las decisiones transversales se registran en `docs/` y se resumen en `PROJECT_MEMORY.md`.
- Se evita agregar dependencias si la necesidad no está validada por una tarea concreta.

## Arranque local

### 1. Instalar dependencias JS

```powershell
npm install
```

### 2. Levantar infraestructura

```powershell
docker compose up -d
docker compose ps
```

### 3. Ejecutar backend y mock

```powershell
dotnet run --project apps/api/src/TiendaOnline.Api/TiendaOnline.Api.csproj
dotnet run --project mocks/fel-sat-mock/FelSatMock.Api.csproj
```

Notas:
- `apps/api` ya incluye `Properties/launchSettings.json`, por lo que `dotnet run` local arranca en `Development`.
- Si Docker Desktop no está iniciado, `/health/ready` no podrá validar PostgreSQL ni Redis.

### 4. Ejecutar apps web y mobile

```powershell
npm run dev:web-store
npm run dev:web-admin
npm run dev:mobile
```

## Web storefront base

Rutas públicas disponibles:
- `/`
- `/catalog`
- `/product/[slug]`
- `/cart`
- `/account`

Capacidades incluidas:
- layout público con header y footer;
- placeholders coherentes para catálogo, producto, carrito y cuenta;
- cliente HTTP base con manejo de errores;
- lectura de `/api/v1/system/info` para mostrar estado de conexión de la API.

## Web admin base

Capacidades incluidas:
- login de desarrollo;
- layout administrativo;
- dashboard con consumo de API;
- placeholders de catálogo, inventario, pedidos, clientes y settings;
- protección de rutas mediante `proxy.ts`.

## Estado de validación real

- `npm run typecheck -w @tienda-online/web-store`: correcto.
- `npm run typecheck -w @tienda-online/web-admin`: correcto.
- `npm run build -w @tienda-online/web-store`: correcto.
- `npm run build -w @tienda-online/web-admin`: correcto.
- `dotnet run --project apps/api/src/TiendaOnline.Api/TiendaOnline.Api.csproj`: correcto en `Development`.
- `GET http://127.0.0.1:8080/health`: responde `200`.
- `GET http://127.0.0.1:8080/api/v1/system/info`: responde `200`.
- `npm run start -w @tienda-online/web-store`: responde `200` en `/`, `/catalog`, `/product/starter-office-kit`, `/cart` y `/account`.

## Hallazgos técnicos importantes

- El error histórico `TypeError: generate is not a function` no fue reproducible en la validación actual.
- El problema real de build en `web-admin` era `useSearchParams()` sin `Suspense` en `/login`, y ya fue corregido.
- Next.js 16 muestra warning de `baseline-browser-mapping` desactualizado; no bloquea build ni ejecución.
- Dentro de sandboxes restringidos, `next build` puede fallar con `spawn EPERM`; fuera de ese entorno la validación pasó.

## Siguientes pasos recomendados

1. Introducir contratos compartidos para storefront cuando haya el primer endpoint real de catálogo.
2. Aplicar la migración SQL de identidad antes de trabajar persistencia real.
3. Agregar OpenAPI cuando se definan endpoints de negocio.
4. Mantener fuera del alcance todavía checkout, pagos, inventario real y FEL/SAT real.
