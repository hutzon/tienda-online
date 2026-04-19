# Handoff - Scaffolding monorepo

Fecha: 2026-04-19
Agente: Codex
Estado: completado

## Contexto recibido

- El repo ya tenía estructura base y documentación de arranque.
- Faltaba confirmar versiones, bootstrapear apps, preparar infraestructura local y resolver la ubicación oficial del mock FEL/SAT.

## Trabajo realizado

- Se fijó el stack base del monorepo con `npm workspaces`, Node `22.13.1`, .NET SDK `10.0.103`, PostgreSQL `17-alpine` y Redis `7.4-alpine`.
- Se inicializaron `apps/web-store`, `apps/web-admin`, `apps/mobile-app` y `apps/api`.
- Se configuró el workspace raíz con `package.json`, `package-lock.json`, `.npmrc`, `.nvmrc`, `.editorconfig`, `.gitignore` y `global.json`.
- Se preparó `docker-compose.yml` con PostgreSQL y Redis persistentes.
- Se formalizó `mocks/fel-sat-mock/` como ubicación oficial del mock FEL/SAT.
- Se actualizó la documentación de arranque y setup local.

## Validaciones ejecutadas

- `npm install`
- `npm ls next`
- `npm run build:web-store`
- `npm run build:web-admin`
- `npm run typecheck:mobile`
- `dotnet build apps/api/TiendaOnline.Api.slnx`
- `dotnet build mocks/fel-sat-mock/FelSatMock.Api.csproj`
- `docker compose up -d`
- `docker compose ps`
- `GET http://localhost:8080/health` -> `200`
- `GET http://localhost:5099/test` -> `200`
- `GET http://localhost:3000` con `next dev` -> `200`
- `GET http://localhost:3001` con `next dev` -> `200`
- `GET http://localhost:19000` con Expo/Metro -> `200`

## Problemas encontrados

- `next build` y `next dev` lanzaron `spawn EPERM` dentro del sandbox; fuera del sandbox funcionaron correctamente.
- Expo reportó intento fallido de instalar React Native DevTools dentro del sandbox, pero Metro igualmente quedó operativo.
- `AddOpenApi` y `MapOpenApi` no estaban disponibles sin agregar dependencia adicional; se dejó fuera de esta fase para mantener la base simple.
- La generación de la solución .NET requirió redirigir `DOTNET_CLI_HOME` al workspace.

## Recomendaciones exactas para el siguiente agente

1. Usar `docs/01_setup_local.md` como guía principal de arranque local.
2. No volver a tomar `Program.cs` en la raíz como fuente operativa del mock; usar `mocks/fel-sat-mock/`.
3. Mantener el backend simple y empezar por módulos vacíos, contratos y testing base.
4. Si se agrega OpenAPI, hacerlo de forma explícita y documentar la dependencia introducida.
5. No avanzar todavía a catálogo, carrito, checkout, pagos reales ni FEL real.
