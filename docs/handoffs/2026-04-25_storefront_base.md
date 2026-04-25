# Handoff 2026-04-25 - Storefront base y estabilización web

## Contexto recibido

- Monorepo inicializado y funcional.
- `apps/api` con backend base, health checks, auth base y roles.
- `apps/web-admin` con base administrativa inicial ya implementada.
- Riesgo documentado previo: `TypeError: generate is not a function` en builds Next.js.
- Commit anterior confirmado: `bada473`.

## Trabajo realizado

- Se verificó la documentación vigente antes de modificar el repositorio.
- Se validó que el error histórico `TypeError: generate is not a function` no se reproduce en el estado actual.
- Se detectó que el bloqueo real de `web-admin` era `useSearchParams()` sin `Suspense` en `/login`.
- Se corrigió `web-admin`:
  - `app/login/page.tsx` quedó como wrapper server-side con `Suspense`.
  - `app/login/LoginView.tsx` concentra la lógica cliente.
  - `middleware.ts` fue reemplazado por `proxy.ts` para alinearse con Next.js 16.
- Se construyó `apps/web-store` con base pública funcional:
  - layout público;
  - header y footer;
  - home con estado de conexión a la API;
  - rutas `/catalog`, `/product/[slug]`, `/cart` y `/account`;
  - placeholders de producto y catálogo;
  - cliente API base con manejo simple de errores.
- Se estabilizó el arranque local de la API agregando `apps/api/src/TiendaOnline.Api/Properties/launchSettings.json` para `Development`.
- Se actualizó documentación operativa (`README.md`, `docs/00_arranque_tecnico.md`, `docs/01_setup_local.md`, `PROJECT_MEMORY.md`).

## Validaciones ejecutadas

- `npm run typecheck -w @tienda-online/web-store` → correcto.
- `npm run typecheck -w @tienda-online/web-admin` → correcto.
- `npm run build -w @tienda-online/web-store` → correcto.
- `npm run build -w @tienda-online/web-admin` → correcto.
- `dotnet run --project apps/api/src/TiendaOnline.Api/TiendaOnline.Api.csproj` → `/health` 200.
- `GET http://127.0.0.1:8080/api/v1/system/info` → 200.
- `npm run start -w @tienda-online/web-store` → `200` en `/`, `/catalog`, `/product/starter-office-kit`, `/cart` y `/account`.

## Problemas encontrados

- El riesgo documentado de Next.js estaba desactualizado; no se reprodujo el error `generate is not a function`.
- El warning de `baseline-browser-mapping` sigue apareciendo en los builds web, pero es no bloqueante.
- Sin Docker Desktop levantado no se puede validar `/health/ready` contra PostgreSQL y Redis.

## Recomendaciones exactas para el siguiente agente

1. Si la siguiente tarea toca dominio real, definir primero contratos compartidos para storefront y admin.
2. No introducir todavía catálogo real, inventario real, checkout, pagos ni FEL real.
3. Si se necesita readiness completa, arrancar Docker Desktop y luego `docker compose up -d`.
4. Mantener `apps/web-store` y `apps/web-admin` separados; no fusionar responsabilidades.
5. Si se toca autenticación, tratar la cookie `admin_token` como mecanismo solo de desarrollo.
