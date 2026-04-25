# TIENDA-ONLINE

Monorepo base del proyecto **TiendaOnline** preparado para desarrollo local inicial.

## Contexto obligatorio

Antes de continuar el desarrollo, revisar:

- `README.md`
- `PROJECT_MEMORY.md`
- `docs/00_arranque_tecnico.md`
- `docs/01_setup_local.md`
- `docs/handoffs/*`
- `TiendaOnline_Master_Plan/docs/*`

## Stack fijado para esta fase

- Package manager y workspace: `npm workspaces`
- Node.js: `22.13.1`
- .NET SDK: `10.0.103`
- Target framework backend/mock: `net10.0`
- PostgreSQL local: `17-alpine`
- Redis local: `7.4-alpine`
- Web storefront: Next.js `16.0.10`
- Web admin: Next.js `16.0.10`
- Mobile: Expo `55.0.0` + React Native `0.83.0`

## Estructura actual

```text
Tienda-Online/
  apps/
    api/
    mobile-app/
    web-admin/
    web-store/
  packages/
    config/
    api-client/
    types/
    ui/
    validation/
  docs/
  infra/
  mocks/
    fel-sat-mock/
  scripts/
  TiendaOnline_Master_Plan/
```

## Estado base actual

- `apps/api`: backend base con health checks, auth base y roles.
- `apps/web-admin`: panel administrativo inicial funcional.
- `apps/web-store`: storefront base con layout público, placeholders y cliente API simple.
- `apps/mobile-app`: bootstrap Expo.
- `mocks/fel-sat-mock`: ubicación oficial del mock FEL/SAT.

## Arranque local rápido

```powershell
npm install
docker compose up -d
dotnet run --project apps/api/src/TiendaOnline.Api/TiendaOnline.Api.csproj
dotnet run --project mocks/fel-sat-mock/FelSatMock.Api.csproj
npm run dev:web-store
npm run dev:web-admin
npm run dev:mobile
```

Notas:
- `apps/api` ya incluye `launchSettings.json`, por lo que `dotnet run` local arranca en `Development`.
- Si Docker Desktop no está iniciado, `docker compose` y `/health/ready` no quedarán operativos.

## Scripts raíz

- `npm run infra:up`
- `npm run infra:down`
- `npm run dev:api`
- `npm run dev:fel-mock`
- `npm run dev:web-store`
- `npm run dev:web-admin`
- `npm run dev:mobile`
- `npm run build:web-store`
- `npm run build:web-admin`
- `npm run typecheck:web-store`
- `npm run typecheck:web-admin`
- `npm run typecheck:mobile`

## Documentos operativos

- `docs/00_arranque_tecnico.md`: decisiones de arranque y arquitectura inicial.
- `docs/01_setup_local.md`: setup local, rutas base y validaciones.
- `PROJECT_MEMORY.md`: memoria viva del proyecto.

## Regla para siguientes agentes

Ninguna tarea se considera cerrada si no actualiza:

- la documentación afectada;
- `PROJECT_MEMORY.md`;
- un handoff nuevo en `docs/handoffs/` cuando aplique.
