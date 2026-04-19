# 00. Arranque técnico

## Propósito

Dejar el proyecto listo para comenzar desarrollo ordenado de Fase 1 sin mezclar decisiones no documentadas ni adelantar módulos complejos de negocio.

## Visión general del sistema

TiendaOnline tendrá tres clientes principales y un backend compartido:

- web pública orientada a SEO, conversión y compra;
- app móvil orientada a experiencia nativa y seguimiento;
- panel administrativo orientado a operación interna;
- backend central responsable del dominio, seguridad e integraciones.

La arquitectura objetivo sigue siendo:

```text
Web Store (Next.js)        Mobile App (Expo)        Admin Web (Next.js)
           \                    |                    /
            \                   |                   /
                     ASP.NET Core Web API
                              |
        +---------------------+----------------------+
        |                     |                      |
   PostgreSQL              Redis               Object Storage
        |                     |                      |
        +---------- Integraciones desacopladas ------+
                              |
          PSP | Email/SMS Provider | FEL Adapter | Mock FEL local
```

## Estructura monorepo adoptada

```text
Tienda-Online/
  apps/
    web-store/
    web-admin/
    mobile-app/
    api/
  packages/
    ui/
    config/
    types/
    api-client/
    validation/
  infra/
    docker/
    db/
    observability/
  docs/
    handoffs/
  mocks/
    fel-sat-mock/
  scripts/
  TiendaOnline_Master_Plan/
```

## Stack técnico fijado

### Confirmado y bootstrapeado

- Gestor de paquetes y workspace: `npm workspaces`
- Node.js: `22.13.1`
- .NET SDK: `10.0.103`
- Backend y mock: `net10.0`
- PostgreSQL local: `17-alpine`
- Redis local: `7.4-alpine`
- Web storefront: Next.js `16.0.10` + TypeScript
- Web admin: Next.js `16.0.10` + TypeScript
- Mobile: Expo `55.0.0` + React Native `0.83.0` + TypeScript
- Backend: ASP.NET Core Web API

### Decisiones técnicas iniciales

- Arquitectura backend inicial: modular monolith.
  Justificación: coincide con la documentación y reduce complejidad temprana.

- Contratos compartidos: `packages/types` y `packages/api-client`.
  Justificación: evita duplicación entre apps sin forzar compartir UI o lógica donde no corresponde.

- Infraestructura local separada en `infra/` y `docker-compose.yml` en raíz.
  Justificación: mantiene visible y simple el arranque local del proyecto.

- Mock FEL/SAT oficial en `mocks/fel-sat-mock/`.
  Justificación: la ruta ya existe en la raíz del monorepo y evita seguir dejando el mock principal enterrado solo en documentación heredada.

- OpenAPI diferido.
  Justificación: en esta fase se priorizó un backend compilable sin dependencias adicionales innecesarias.

## Módulos principales del sistema

### Clientes

- `web-store`: catálogo, carrito, checkout, auth, tracking y contenido SEO.
- `web-admin`: productos, inventario, pedidos, facturación, clientes, reportes y auditoría.
- `mobile-app`: auth, catálogo, carrito, checkout, tracking, perfil y push notifications.

### Backend

- Auth
- Customers
- Catalog
- Inventory
- Cart
- Checkout
- Orders
- Payments
- Shipping
- Promotions
- Notifications
- Invoicing / FEL
- Admin
- Audit

## Estado actual de implementación

### Ya resuelto

1. Workspace raíz funcional con `npm workspaces`.
2. Apps base creadas:
   - `apps/web-store`
   - `apps/web-admin`
   - `apps/mobile-app`
   - `apps/api`
3. Infra local mínima operativa con PostgreSQL y Redis.
4. Mock FEL/SAT oficial definido y ejecutable.
5. Variables de entorno de ejemplo por app.
6. Scripts raíz de desarrollo y build.

### No incluido todavía

- pagos reales;
- integración real con SAT/FEL;
- catálogo, carrito, checkout y pedidos;
- autenticación completa;
- pantallas de negocio completas;
- selección cerrada de PSP, certificador FEL o courier.

## Riesgos detectados

- No hay Git inicializado en esta carpeta.
- `Program.cs` en la raíz sigue existiendo y puede confundir si no se usa la documentación actualizada.
- Los comandos de Next.js y Expo dentro del sandbox pueden lanzar `spawn EPERM`; fuera del sandbox funcionaron correctamente.
- OpenAPI todavía no está incorporado.

## Supuestos pendientes por confirmar

- Web y admin seguirán como apps separadas, no como una sola app Next.js con áreas internas.
- El backend se mantendrá como una sola API inicial, sin BFFs separados.
- El primer paso de dominio será estructura modular y contratos, no lógica de negocio completa.

## Contradicciones o vacíos ya resueltos

- La ruta canónica del mock ya no es ambigua: `mocks/fel-sat-mock/`.
- `Program.cs` en raíz queda solo como referencia histórica temporal.
- El vacío de bootstrap quedó cubierto con `docs/01_setup_local.md`.

## Siguientes pasos priorizados

1. Definir ADR corta para contratos compartidos y estrategia de cliente API.
2. Agregar smoke tests y pruebas base del backend.
3. Introducir OpenAPI cuando existan primeros endpoints reales.
4. Preparar la base de modularización backend por bounded contexts.
5. Mantener el alcance en Fase 1 sin adelantar módulos de negocio.
