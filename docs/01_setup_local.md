# 01. Setup local y scaffolding

## Objetivo

Documentar la base técnica realmente inicializada del monorepo y el procedimiento de arranque local.

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

## Decisiones técnicas de esta tarea

- Se adopta `npm workspaces` en lugar de `pnpm`.
  Justificación: `npm` ya estaba instalado y funcional en el entorno; evita agregar un bootstrap adicional en esta fase.

- Se fija Node `22.13.1` mediante `.nvmrc` y `package.json`.
  Justificación: coincide con el entorno local disponible y reduce desviaciones entre agentes.

- Se fija .NET SDK `10.0.103` mediante `global.json`.
  Justificación: el entorno local ya tiene esa versión y permite usar `net10.0` sin instalar tooling extra.

- PostgreSQL queda en `17-alpine`.
  Justificación: versión soportada y actual para desarrollo local, con imagen ligera.

- Redis queda en `7.4-alpine`.
  Justificación: versión estable para cache y colas locales sin adelantarse a tuning productivo.

- Next.js queda en `16.0.10`.
  Justificación: se actualizó a versión parchada durante esta tarea por advertencia de seguridad detectada en `16.0.1`.

## Estructura creada

### Workspace JS

- `package.json`
- `package-lock.json`
- `.npmrc`
- `.nvmrc`
- `packages/config/tsconfig.base.json`
- `packages/config/tsconfig.nextjs.json`
- `packages/config/tsconfig.expo.json`

### Aplicaciones

- `apps/web-store`: Next.js + TypeScript con pantalla inicial simple.
- `apps/web-admin`: Next.js + TypeScript con pantalla inicial simple.
- `apps/mobile-app`: Expo + React Native + TypeScript con pantalla inicial simple.
- `apps/api`: ASP.NET Core Web API base con `/` y `/health`.

### Infra local

- `docker-compose.yml`
- volúmenes persistentes para PostgreSQL y Redis
- puertos locales:
  - PostgreSQL `5432`
  - Redis `6379`
  - API `8080`
  - Web Store `3000`
  - Web Admin `3001`
  - Expo `19000`
  - Mock FEL `5099`

### Mock FEL/SAT

- Ubicación oficial: `mocks/fel-sat-mock/`
- Fuente heredada conservada: `TiendaOnline_Master_Plan/mocks/fel-sat-mock/`
- `Program.cs` en la raíz: referencia histórica temporal, no entrypoint operativo

## Variables de entorno base

- Raíz: `.env.example`
- API: `apps/api/.env.example`
- Web Store: `apps/web-store/.env.example`
- Web Admin: `apps/web-admin/.env.example`
- Mobile: `apps/mobile-app/.env.example`
- Mock FEL: `mocks/fel-sat-mock/.env.example`

## Convenciones iniciales

- Nombres de apps en kebab-case.
- Código compartido solo en `packages/` cuando reduzca duplicación real.
- Backend base en `apps/api/src/TiendaOnline.Api`.
- Toda nueva decisión transversal debe documentarse en `docs/` y resumirse en `PROJECT_MEMORY.md`.

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

### 4. Ejecutar apps web y mobile

```powershell
npm run dev:web-store
npm run dev:web-admin
npm run dev:mobile
```

## Estado de validación real

- `docker compose up -d`: ejecutado correctamente.
- `docker compose ps`: PostgreSQL y Redis en estado healthy.
- `dotnet build apps/api/TiendaOnline.Api.slnx`: correcto.
- `dotnet build mocks/fel-sat-mock/FelSatMock.Api.csproj`: correcto.
- `GET http://localhost:8080/health`: responde `200`.
- `GET http://localhost:5099/test`: responde `200`.
- `npm run build:web-store`: correcto.
- `npm run build:web-admin`: correcto.
- `npm run dev` de `web-store`: responde `200` fuera del sandbox.
- `npm run dev` de `web-admin`: responde `200` fuera del sandbox.
- `npm run typecheck:mobile`: correcto.
- Expo/Metro en `localhost:19000`: responde `200` fuera del sandbox.

## Limitaciones conocidas

- Los comandos `next dev` y `next build` dentro del sandbox pueden lanzar `spawn EPERM`; fuera del sandbox funcionaron correctamente.
- Expo intentó instalar React Native DevTools en modo sandbox y reportó `spawn EPERM`, pero Metro igual inició y respondió localmente.
- La API base no expone OpenAPI todavía para evitar dependencias adicionales en esta fase.

## Siguientes pasos recomendados

1. Crear ADR corta para contratos compartidos entre API, web, admin y mobile.
2. Agregar tests base del backend y smoke tests automáticos del monorepo.
3. Introducir OpenAPI de forma controlada cuando se definan primeros endpoints reales.
4. Preparar estructura inicial de módulos backend sin implementar dominio complejo.
5. Definir una primera capa de componentes compartidos en `packages/ui` solo si la duplicación empieza a ser real.
