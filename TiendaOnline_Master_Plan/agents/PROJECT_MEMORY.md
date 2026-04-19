# PROJECT MEMORY - TiendaOnline

## Objetivo del proyecto
Construir una tienda online profesional con:
- web pública
- apps móviles
- panel administrativo
- PostgreSQL
- pagos online y contra entrega
- integración futura con FEL/SAT
- mock local FEL para desarrollo

## Decisiones vigentes
- Web y admin: Next.js
- Mobile: Expo / React Native
- Backend: ASP.NET Core
- DB: PostgreSQL
- FEL: adaptador + certificador + mock local
- Trabajo multiagente con documentación obligatoria

## Reglas persistentes
- Ningún agente cierra tarea sin actualizar documentación.
- Ningún agente introduce proveedor externo acoplado al dominio.
- Seguridad por defecto.
- Auditoría en operaciones sensibles.
- Cualquier cambio de arquitectura debe quedar documentado.
- Guest checkout sí está permitido.
- Dirección exacta y contacto verificado son obligatorios.

## Pendientes globales iniciales
- definir PSP específico
- definir certificador FEL específico
- definir proveedor de SMS/email definitivo
- definir logística/courier
- definir branding y diseño visual
