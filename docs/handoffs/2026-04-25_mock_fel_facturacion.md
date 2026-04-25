# Handoff: Flujo de Facturación y Mock FEL/SAT (2026-04-25)

## Trabajo Realizado

1. **Diseño de Dominio (Facturación)**:
   - Se crearon las entidades `Invoice` e `InvoiceLine` bajo un esquema aislado para representar documentos fiscales de forma inmutable y 1 a N con `Order`.
   - Se integraron los modelos en el `AppCommerceContext` de EF Core.
   - Se creó el script de migración SQL puro `infra/db/migrations/003_create_billing_tables.sql`.

2. **Integración con Proveedor Mock**:
   - Se definió la abstracción `IFelProvider` para futuros certificadores reales.
   - Se implementó `MockFelProvider` que autentica vía Basic Auth y se comunica con el servicio local Node/C# que se encuentra en `mocks/fel-sat-mock`.
   - Se agregó la configuración en `appsettings.json` apuntando a `http://127.0.0.1:5153`.

3. **Backend (`TiendaOnline.Api`)**:
   - `BillingEndpoints.cs` expone `POST /api/v1/admin/orders/{orderId}/invoices` para que el administrador decida el momento de emitir la factura para una orden confirmada.
   - La respuesta expone información del UUID y Firma SAT simulados.

4. **Frontend Administrativo (`apps/web-admin`)**:
   - En la vista de Órdenes (`OrdersView.tsx`), si una orden está "Confirmada" pero sin factura, se habilita un botón para "Emitir Factura".
   - El estado cambia visualmente con badges informando "Emitted" y desplegando el UUID devuelto.

5. **Frontend Público (`apps/web-store`)**:
   - En la pantalla de éxito del checkout, se añadió una sección de "Documento Fiscal" informando si la orden ya tiene factura o está "Pendiente de emisión".

## Validaciones Ejecutadas
- [x] Construcción del Backend exitosa y `dotnet test` pasando (11/11 tests, incluyendo emisión de factura).
- [x] Ejecución de `npm run typecheck` en todos los proyectos front-end sin errores tipográficos.
- [x] Verificación de lógica de guardias: no se permite facturar órdenes no confirmadas.

## Riesgos y Problemas Identificados
- **Servicio Mock Apagado**: Si el entorno `mocks/fel-sat-mock/` no está ejecutándose en `http://127.0.0.1:5153`, el proveedor fallará. Se debe asegurar su disponibilidad en entornos de desarrollo mediante Docker Compose si se usa intensivamente. En los tests unitarios, el fallback o error no bota el sistema (responde BadRequest), lo cual es estable.
- **Acoplamiento**: El pago en línea devuelve "Confirmed" pero la factura actualmente debe ser disparada de manera síncrona o manual. Un paso ideal será un "WebHook" interno u observer de dominios para que al momento de marcar una orden como `Confirmed` o `Paid`, se emita la factura en background.

## Siguientes Pasos Recomendados
- Crear un servicio en background (`IHostedService` o similar, como Hangfire/Quartz) para procesar colas de facturas asíncronamente en lugar de que el administrador deba darle click a cada orden, o automatizarlo en el hook de éxito del PSP.
- Diseñar la integración con un certificador real implementando un nuevo `IFelProvider`.
- Finalizar el envío de correo con la factura adjunta (Notificaciones).
