# 01. Decisión de stack

## Recomendación

### Opción recomendada
- **Web storefront:** Next.js + TypeScript
- **Admin panel:** Next.js + TypeScript
- **Mobile apps:** Expo / React Native + TypeScript
- **Backend:** ASP.NET Core Web API
- **Base de datos:** PostgreSQL
- **Cache / colas / rate limit:** Redis
- **Búsqueda (fase 2 o 3):** PostgreSQL full-text al inicio; Elastic/OpenSearch si escala
- **Archivos / media:** S3 compatible
- **Pagos:** proveedor con checkout hospedado o campos tokenizados
- **FEL:** adaptador a certificador + mock local

## Qué no recomiendo como primera apuesta

### React Native Web como única solución total
Sí puede funcionar para MVP, pero no la usaría como apuesta única para una tienda grande con fuerte SEO, marketing, landing pages y admin complejo.

### Flutter como solución total
Flutter es excelente en móvil, pero para storefront con fuerte SEO y crecimiento orgánico no es mi primera opción.

## Criterio arquitectónico realista

### Lo mejor para negocio
- web pensada como web;
- móvil pensado como móvil;
- backend único y sólido;
- librerías compartidas donde tenga sentido.

## Qué sí compartir

Compartir entre web y mobile:
- tipos TypeScript o contratos OpenAPI generados;
- validaciones de negocio simples;
- cliente API;
- diseño visual;
- componentes de dominio reutilizables;
- utilidades de tracking, analytics y feature flags.

No compartir por obligación:
- checkout web
- SEO
- páginas de marketing
- algunas pantallas admin
- capacidades nativas móviles

## Backend recomendado

ASP.NET Core Web API con arquitectura modular:
- Catalog
- Inventory
- Orders
- Payments
- Shipping
- Auth
- Customers
- Notifications
- Invoicing/FEL
- Admin
- Audit

## Base de datos

PostgreSQL como base principal por:
- solidez transaccional;
- buen soporte para JSONB;
- índices potentes;
- extensiones útiles;
- excelente compatibilidad con .NET.

## Repositorios

- monorepo con apps y packages
o
- repos separados si el equipo crece mucho.

Para arrancar: **monorepo**.
