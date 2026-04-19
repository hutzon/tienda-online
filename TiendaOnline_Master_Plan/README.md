# TiendaOnline - Master Plan

Este paquete contiene la propuesta inicial del proyecto **TiendaOnline** con enfoque profesional para:

- tienda web pública
- app móvil Android/iOS
- panel de administración
- backend desacoplado
- PostgreSQL
- pagos en línea y pago contra entrega
- integración futura con FEL/SAT mediante adaptador
- mock local de SAT/FEL para desarrollo y pruebas
- flujo de trabajo con agentes y documentación obligatoria por tarea

## Decisión principal

**Recomendación final:**
- **Web pública + admin:** Next.js
- **Apps móviles:** Expo / React Native
- **Backend:** ASP.NET Core Web API + PostgreSQL
- **Mensajería:** Email + SMS/OTP vía proveedores externos
- **Facturación FEL:** Adaptador interno + certificador autorizado + mock local durante desarrollo

## Por qué esta arquitectura

No recomiendo apostar toda la tienda a un solo framework “universal” si el objetivo es vender de forma seria.

La web de una tienda necesita:
- SEO real
- páginas rápidas y cacheables
- landing pages
- catálogo indexable
- checkout estable
- panel administrativo robusto

Las apps móviles necesitan:
- experiencia nativa
- notificaciones push
- cámara / archivos / mapas
- buen rendimiento en carrito, perfil y seguimiento de pedidos

El backend necesita:
- reglas de negocio
- inventario
- facturación
- auditoría
- seguridad
- integraciones externas

## Contenido

- `docs/01_decision_stack.md`
- `docs/02_arquitectura_general.md`
- `docs/03_backend_modulos.md`
- `docs/04_frontend_web_mobile_admin.md`
- `docs/05_sat_fel_estrategia.md`
- `docs/06_seguridad_y_compliance.md`
- `docs/07_roadmap_fases.md`
- `docs/08_prompts_agentes.md`
- `docs/09_estructura_repos.md`
- `docs/10_operacion_y_devops.md`
- `docs/11_template_handoff.md`
- `agents/PROJECT_MEMORY.md`
- `agents/TASK_COMPLETION_TEMPLATE.md`
- `mocks/fel-sat-mock/*`

## Regla obligatoria para agentes

Cada agente debe:
1. implementar su tarea;
2. actualizar la documentación afectada;
3. registrar qué cambió, por qué cambió y qué queda pendiente;
4. dejar instrucciones para el siguiente agente.

Esto evita que el proyecto quede como un rompecabezas armado por veinte personas y entendido por ninguna.
