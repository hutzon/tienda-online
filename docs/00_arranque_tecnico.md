# 00. Arranque técnico

## Propósito

Dejar el proyecto listo para desarrollo ordenado de Fase 1 sin adelantar módulos complejos de negocio.

## Visión general del sistema

TiendaOnline tendrá tres clientes y un backend compartido:

- web pública orientada a SEO, conversión y compra;
- app móvil orientada a experiencia nativa y seguimiento;
- panel administrativo orientado a operación interna;
- backend central responsable del dominio, seguridad e integraciones.

Arquitectura objetivo:

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

## Decisiones técnicas iniciales

- Arquitectura backend inicial: modular monolith.
  Justificación: reduce complejidad temprana y coincide con la documentación vigente.

- Contratos compartidos potenciales en `packages/types` y `packages/api-client`.
  Justificación: evita duplicación futura sin acoplar prematuramente las apps.

- Infraestructura local visible desde raíz con `docker-compose.yml`.
  Justificación: simplifica arranque y soporte entre agentes.

- Mock FEL/SAT oficial en `mocks/fel-sat-mock/`.
  Justificación: elimina ambigüedad con referencias heredadas.

- `apps/api` con `launchSettings.json` para `Development` local.
  Justificación: estabiliza `dotnet run` y evita errores 500 por configuración incompleta en local.

## Estado actual de implementación

### Ya resuelto

1. Workspace raíz funcional con `npm workspaces`.
2. Apps base creadas: `apps/web-store`, `apps/web-admin`, `apps/mobile-app`, `apps/api`.
3. Infra local mínima preparada con PostgreSQL y Redis.
4. Mock FEL/SAT oficial definido y ejecutable.
5. Backend base con health checks, auth base y roles.
6. Web admin base funcional con login de desarrollo y dashboard.
7. Storefront base funcional con rutas públicas placeholder y consumo básico de API.
8. Builds de `web-store` y `web-admin` validados correctamente.

### No incluido todavía

- pagos reales;
- integración real con SAT/FEL;
- catálogo real conectado a base de datos;
- carrito, checkout y pedidos reales;
- autenticación final de clientes;
- branding definitivo.

## Módulos principales del sistema

### Clientes

- `web-store`: catálogo, carrito, checkout, auth y contenido SEO.
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

## Riesgos detectados

- Si Docker Desktop no está iniciado, `docker compose` no puede validar PostgreSQL y Redis.
- `Program.cs` en la raíz sigue existiendo como referencia histórica y puede confundir si no se sigue la documentación.
- Next.js 16 muestra warning de `baseline-browser-mapping` desactualizado; no bloquea build.
- OpenAPI todavía no está incorporado.

## Hallazgos resueltos

- La ruta canónica del mock ya no es ambigua: `mocks/fel-sat-mock/`.
- El error histórico `TypeError: generate is not a function` no fue reproducido en la validación actual.
- El problema real de `web-admin` era el uso de `useSearchParams()` sin `Suspense`, ya corregido.

## Siguientes pasos priorizados

1. Definir contratos compartidos para catálogo cuando exista el primer endpoint real.
2. Aplicar la migración SQL de identidad.
3. Introducir OpenAPI cuando aparezcan endpoints de negocio.
4. Mantener el alcance en Fase 1 sin adelantar módulos de negocio complejos.
