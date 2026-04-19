# Handoff — Base administrativa inicial (web-admin)

Fecha: 2026-04-19
Agente: Claude Sonnet 4.6
Estado: completado — commit ejecutado

## Contexto recibido

- Monorepo inicializado y funcional.
- `apps/api` con health checks, `/api/v1/system/info`, auth JWT, roles Admin/Staff/Customer.
- `GET /api/v1/admin/ping` requiere rol Admin (JWT Bearer).
- `POST /api/v1/auth/dev/token` genera JWT de desarrollo (solo en entorno Development).
- `apps/web-admin` existía con estructura mínima: un `page.tsx` de bootstrap, `layout.tsx`, `globals.css`.
- Sin rutas protegidas, sin login, sin layout administrativo.
- 7 tests de backend pasando.

## Trabajo realizado

### Capa de API cliente (`apps/web-admin/lib/`)

- `lib/session.ts` — gestión de sesión via cookie `admin_token`:
  - `getToken()` / `setToken(token)` / `clearToken()`
  - Cookie con `SameSite=Strict`, expira en 1 día
  - Legible desde JavaScript (intencional para dev; compatible con middleware Next.js)

- `lib/api/client.ts` — `apiFetch<T>(path, options)`:
  - Base URL desde `NEXT_PUBLIC_API_BASE_URL`
  - Inyección de `Authorization: Bearer <token>` cuando `authenticated: true`
  - `ApiError` con código HTTP para manejo tipado de errores

- `lib/api/auth.ts` — `requestDevToken(username, role)`:
  - Llama `POST /api/v1/auth/dev/token`
  - Retorna `DevTokenResponse { token, expiresIn, warning }`

- `lib/api/system.ts` — `getSystemInfo()` y `pingAdmin()`:
  - `getSystemInfo()` → `GET /api/v1/system/info` (público)
  - `pingAdmin()` → `GET /api/v1/admin/ping` (autenticado)

### Middleware de protección de rutas (`apps/web-admin/middleware.ts`)

- Rutas protegidas: `/dashboard`, `/catalog`, `/inventory`, `/orders`, `/customers`, `/settings`
- Sin token → redirect a `/login?next=<ruta_original>`
- Con token en `/login` → redirect a `/dashboard`
- Verifica existencia de la cookie (no valida el JWT en sí; suficiente para dev)

### Login de desarrollo (`apps/web-admin/app/login/page.tsx`)

- Formulario con campo `username` (por defecto: `admin-dev`)
- Siempre asigna rol `Admin` (único rol relevante para el panel)
- On submit: llama `requestDevToken`, guarda token con `setToken`, redirige a `next` o `/dashboard`
- Muestra error si la API no responde (ej. backend no iniciado)
- Si ya hay token → redirect automático a `/dashboard`

### Layout administrativo

- `app/(admin)/layout.tsx` — layout del grupo protegido: `Sidebar + Topbar + children`
- `components/admin/Sidebar.tsx` (Client Component):
  - Marca enlace activo con `usePathname()`
  - Navegación: Dashboard, Catálogo, Inventario, Pedidos, Clientes, Configuración
  - Badge de entorno: "Development"
- `components/admin/Topbar.tsx` (Client Component):
  - Badge de rol "Admin"
  - Botón logout: llama `clearToken()` y redirige a `/login`

### Dashboard (`app/(admin)/dashboard/page.tsx`)

- Client Component con `useEffect` para fetch al montar
- Muestra tres secciones:
  1. Info local: nombre del proyecto, entorno, API base URL
  2. Respuesta de `/api/v1/system/info`: nombre, versión, entorno, timestamp
  3. Respuesta de `/api/v1/admin/ping`: mensaje de éxito o error HTTP con código
- Estados: `idle → loading → ok | error` con indicadores visuales

### Páginas placeholder

- `app/(admin)/catalog/page.tsx`
- `app/(admin)/inventory/page.tsx`
- `app/(admin)/orders/page.tsx`
- `app/(admin)/customers/page.tsx`
- `app/(admin)/settings/page.tsx`
- Todas usan `components/admin/PlaceholderPage.tsx` con título, descripción y nombre de módulo
- Incluyen `export const metadata` con título de pestaña correcto

### Actualización de raíz

- `app/page.tsx` → `redirect('/dashboard')` (Server Component)
- `app/layout.tsx` → metadata actualizada
- `app/globals.css` → reescrito con dark theme completo para admin (variables CSS, sidebar, topbar, login, dashboard, placeholders)

### Variables de entorno

- `.env.local` (gitignored):
  ```
  NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
  NEXT_PUBLIC_APP_ENV=local
  ```

## Decisiones técnicas

1. **Cookie sobre localStorage para el token.**
   El middleware de Next.js corre en el edge y no puede acceder a localStorage.
   La cookie permite que el middleware lea el token y haga redirects server-side.
   No se usó `httpOnly` para que el cliente también pueda leer el token y adjuntarlo
   en las llamadas a la API.

2. **Middleware superficial (verifica existencia, no validez del JWT).**
   Para esta fase de desarrollo, verificar que la cookie exista es suficiente.
   Si el token expiró o es inválido, la API retornará 401/403 y el frontend lo mostrará.
   Validar el JWT en el middleware requeriría la clave secreta en el frontend, lo cual
   no es apropiado.

3. **Grupo de rutas `(admin)` en Next.js App Router.**
   Permite que el layout administrativo no afecte a `/login` ni a la raíz `/`.
   Patrón estándar en Next.js App Router para separar layouts sin cambiar las URLs.

4. **Rol hardcodeado a `Admin` en el login de desarrollo.**
   El panel admin solo tiene sentido con rol Admin. Simplifica el flujo de dev.
   Si en el futuro se necesita probar Staff, se puede extender el formulario.

5. **PlaceholderPage como componente compartido.**
   Evita duplicar estructura en los 5 módulos futuros.
   Contiene el mensaje estándar de "próximamente" con el nombre del módulo.

6. **`apiFetch` centralizado con `authenticated` flag.**
   Evita inyectar el token manualmente en cada llamada.
   Permite agregar lógica de refresh/retry en un solo lugar cuando sea necesario.

## Validaciones ejecutadas

| Validación | Resultado |
|---|---|
| `npm install --workspace=apps/web-admin` | ✓ Correcto |
| `tsc --noEmit` en `apps/web-admin` | ✓ 0 errores, 0 advertencias |
| `next build` en `apps/web-admin` | ⚠ Falla (ver problema 1) |
| `next build` en `apps/web-store` (no modificado) | ⚠ Mismo error — confirma pre-existencia |
| `dotnet build TiendaOnline.Api.slnx` | ✓ 0 errores (sin cambios en API) |
| `dotnet test TiendaOnline.Api.slnx` | ✓ 7/7 correctos (sin cambios en API) |

## Problemas encontrados

### 1. `next build` falla con `TypeError: generate is not a function`

- **Afecta a**: `apps/web-admin` y `apps/web-store` (no modificada).
- **Error**: `TypeError: generate is not a function` con frames ignorados (`at ignore-listed frames`).
- **Causa probable**: incompatibilidad de Next.js 16.0.10 con una dependencia del entorno
  (posiblemente `baseline-browser-mapping` u otra dependencia de CSS/PostCSS).
- **Confirmación de pre-existencia**: `apps/web-store` produce el mismo error sin ninguna
  modificación de mi parte. Por lo tanto, NO fue introducido por esta tarea.
- **Impacto**: no se puede generar la build de producción. El modo `next dev` no está afectado.
- **El código TypeScript es válido**: `tsc --noEmit` pasa sin errores.
- **Acción recomendada para el siguiente agente**: investigar y resolver antes de pasar a
  ambientes de staging/producción. Ver sección de recomendaciones.

## Limitaciones conocidas

- El login solo solicita el nombre de usuario; no hay contraseña (por diseño, es dev-only).
- El middleware no valida la firma del JWT (solo verifica existencia de la cookie).
- La cookie no es `httpOnly` (necesario para que el cliente pueda leer el token).
- El dashboard muestra errores de red si la API no está corriendo; es el comportamiento esperado.
- La navegación de la sidebar no tiene íconos SVG reales; usa caracteres Unicode como placeholder.

## Archivos creados

```
apps/web-admin/
  middleware.ts
  .env.local
  lib/
    session.ts
    api/
      client.ts
      auth.ts
      system.ts
  components/
    admin/
      Sidebar.tsx
      Topbar.tsx
      PlaceholderPage.tsx
  app/
    (admin)/
      layout.tsx
      dashboard/page.tsx
      catalog/page.tsx
      inventory/page.tsx
      orders/page.tsx
      customers/page.tsx
      settings/page.tsx
    login/page.tsx
```

## Archivos modificados

```
apps/web-admin/
  app/globals.css     ← reescrito con dark theme completo
  app/layout.tsx      ← metadata actualizada
  app/page.tsx        ← redirect → /dashboard

PROJECT_MEMORY.md     ← actualizado con tarea 4
docs/handoffs/2026-04-19_web_admin_base.md  ← este archivo
```

## Recomendaciones para el siguiente agente

1. **Resolver `next build`**: El error `TypeError: generate is not a function` afecta a ambas
   apps Next.js. Investigar actualizando `baseline-browser-mapping` (`npm i baseline-browser-mapping@latest -D`)
   o actualizando las dependencias del workspace. Si el error persiste, considerar bajar a
   Next.js 15.x o esperar un patch de Next.js 16.

2. **Verificar login en dev**: Con `docker compose up -d` y la API corriendo, acceder a
   `http://localhost:3001`. Debe redirigir a `/login`, permitir acceso con usuario cualquiera
   y rol Admin, mostrar el dashboard con los datos de la API.

3. **Para verificar protección de rutas**: Eliminar la cookie `admin_token` desde DevTools
   y confirmar que `/dashboard` redirige a `/login`.

4. **No implementar todavía**: CRUDs reales de catálogo, inventario, pedidos, clientes.
   Estos módulos tienen páginas placeholder correctamente estructuradas.

5. **Siguiente prioridad sugerida**: Resolver el build issue de Next.js, luego definir el
   contrato de API compartido en `packages/types` y `packages/api-client`.

6. **Cuando se implemente auth real**: Migrar a cookie `httpOnly` + refresh token.
   El middleware actual deberá actualizarse para validar el JWT server-side.

7. **Microsoft.AspNetCore.Mvc.Testing**: Considerar actualizar de `10.0.0-preview.3.25172.1`
   a `10.0.3` (versión estable) en el proyecto de tests de la API.
