# Handoff — Historial real de seguimiento de pedido (OrderTrackingEvent)

**Fecha:** 2026-05-16  
**Prompt formal:** 16 (completo) — Partes B, C, D, E de la especificación  
**Contexto:** Las partes conversacionales (cart race condition fix, admin auto-refresh, página /track básica) fueron implementadas en la sesión anterior. Esta sesión implementa el modelo de historial real.

---

## Qué se implementó

### Parte B — Modelo de datos

**Entidad `OrderTrackingEvent`**  
Archivo: `apps/api/src/TiendaOnline.Api/Modules/Orders/Entities/OrderTrackingEvent.cs`

Campos:
| Campo      | Tipo        | Descripción                                |
|------------|-------------|--------------------------------------------|
| Id         | UUID        | PK, auto-generado                          |
| OrderId    | UUID        | FK → commerce.orders (CASCADE DELETE)      |
| Status     | VARCHAR(30) | Estado del evento (ver tabla abajo)        |
| Comment    | TEXT        | Comentario opcional del operador           |
| CreatedBy  | VARCHAR(200)| Nombre del usuario que registró (opcional) |
| CreatedAt  | TIMESTAMPTZ | Timestamp UTC del evento                   |

**Estados válidos** (en `TrackingStatuses` — `CommerceConstants.cs`):

| Valor          | Etiqueta en español   |
|----------------|-----------------------|
| OrderReceived  | Pedido recibido       |
| Preparing      | Preparando            |
| Packed         | Empacado              |
| InTransit      | En camino             |
| Delivered      | Entregado             |
| Cancelled      | Cancelado             |

**Migración:** `infra/db/migrations/006_add_order_tracking_events.sql`  
Aplicada al Docker PostgreSQL (puerto 5433) el 2026-05-16.

---

### Parte C — Endpoints backend

**Endpoint público actualizado:**
```
GET /api/v1/orders/track?number={orderNumber}
```
Ahora incluye el campo `events: []` con la historia cronológica de eventos. Los eventos se ordenan ASC por `CreatedAt`.

**Nuevos endpoints admin (requieren JWT con rol Admin):**
```
GET  /api/v1/admin/orders/{id}/tracking      → Lista eventos DESC por createdAt
POST /api/v1/admin/orders/{id}/tracking      → Registra nuevo evento
     Body: { status: string, comment?: string, createdBy?: string }
     Returns: 201 Created con el evento creado
```

**Records añadidos en `OrderEndpoints.cs`:**
```csharp
public sealed record OrderTrackingEventResponse(
    Guid Id, string Status, string? Comment, string? CreatedBy, DateTimeOffset CreatedAt);

public sealed record AddTrackingEventRequest(
    string Status, string? Comment, string? CreatedBy);
```

`OrderTrackingResponse` ahora es:
```csharp
public sealed record OrderTrackingResponse(
    string OrderNumber, string Status, string Currency, decimal Total,
    DateTimeOffset CreatedAt, string? PaymentMethod, string? PaymentStatus,
    List<OrderTrackingItemResponse> Items,
    List<OrderTrackingEventResponse> Events);   // <-- nuevo
```

---

### Parte D — Admin UI

**Archivo:** `apps/web-admin/app/(admin)/orders/OrdersView.tsx`

- Nueva columna "Seguimiento" (columna 11) con botón `▼ Seguimiento / ▲ Ocultar`.
- Al abrir el panel se carga el historial con `GET /api/v1/admin/orders/{id}/tracking`.
- Panel expandible como `<tr colSpan={11}>` inmediatamente después del row de la orden.
- Panel dividido en dos columnas:
  - **Historial:** Lista de eventos con estado, timestamp y comentario. "Sin eventos registrados" si vacío.
  - **Registrar:** Select de estado + textarea de comentario + botón Registrar.
- Los eventos nuevos se insertan al inicio de la lista sin recargar toda la página.
- El `createdBy` se envía como `"Admin"` automáticamente.
- Los eventos del historial se cachean por `orderId` en el estado del componente para evitar cargas repetidas.

**Nuevas funciones en `apps/web-admin/lib/api/commerce.ts`:**
```typescript
fetchOrderTracking(orderId: string): Promise<OrderTrackingEventResponse[]>
addOrderTrackingEvent(orderId, status, comment?, createdBy?): Promise<OrderTrackingEventResponse>
```

---

### Parte E — Storefront `/track` actualizado

**Archivo:** `apps/web-store/app/track/page.tsx`

Lógica de presentación del timeline:
- Si `result.events.length > 0` → componente `<TrackingHistory>` con historial real.
- Si `result.events.length === 0` → componente `<StaticTimeline>` (5 pasos estáticos, comportamiento anterior como fallback).

`TrackingHistory` muestra por cada evento:
- Etiqueta en español del estado.
- Timestamp formateado con `toLocaleString('es-GT')`.
- Comentario en itálica (si existe).
- "Actualizado por: X" en gris (si `createdBy` presente).
- El estado `Cancelled` tiene punto rojo en vez del color accent.

**Interface actualizada en `apps/web-store/lib/api/commerce.ts`:**
```typescript
export interface OrderTrackingEvent {
  id: string;
  status: string;
  comment: string | null;
  createdBy: string | null;
  createdAt: string;
}

// OrderTrackingResponse ahora incluye:
events: OrderTrackingEvent[];
```

**CSS nuevas clases en `globals.css`:**
- `.track-step-date` — timestamp del evento
- `.track-step-comment` — comentario en itálica
- `.track-step--cancelled .track-step-dot` — punto rojo para eventos Cancelled

---

## Flujo manual de prueba

### Escenario completo:

1. **Hacer una compra** en `http://localhost:3000` (CashOnDelivery o OnlineSimulated).
2. Al llegar a la success page, copiar el número de orden (`ORD-...`).
3. **Ver tracking inicial:** Ir a `http://localhost:3000/track?numero=ORD-...` → muestra timeline estático (sin eventos).
4. **Abrir admin:** `http://localhost:3001/orders` → buscar la orden → click `▼ Seguimiento`.
5. **Registrar primer evento:** Seleccionar "Pedido recibido" → Registrar → aparece en el panel.
6. **Registrar progreso:** Seleccionar "Preparando" + comentario "Preparando tu pedido" → Registrar.
7. **Volver a storefront:** Recargar `/track?numero=ORD-...` → ahora muestra historial real con 2 eventos y sus timestamps.
8. **Registrar "En camino":** Añadir comentario con número de guía si aplica.
9. **Registrar "Entregado"** cuando se confirme la entrega.

### Prueba de API directa:
```
GET  http://localhost:8080/api/v1/orders/track?number=ORD-xxx
     → incluye events: [] (vacío si sin eventos) o events: [{ status, comment, createdAt, ... }]

POST http://localhost:8080/api/v1/admin/orders/{id}/tracking
     Headers: Authorization: Bearer {admin_jwt}
     Body: { "status": "Preparing", "comment": "Preparando tu pedido" }
     → 201 con el evento creado

GET  http://localhost:8080/api/v1/admin/orders/{id}/tracking
     → lista de eventos DESC
```

---

## Validaciones ejecutadas

| Validación | Resultado |
|---|---|
| `dotnet build --no-incremental` | ✓ 0 errores |
| `dotnet test` | ✓ 15/15 |
| `npm run typecheck -w @tienda-online/web-store` | ✓ sin errores |
| `npm run typecheck -w @tienda-online/web-admin` | ✓ sin errores |
| `npm run build -w @tienda-online/web-store` | ✓ 9 rutas |
| `npm run build -w @tienda-online/web-admin` | ✓ 11 rutas |
| Migración 006 aplicada a Docker PostgreSQL | ✓ CREATE TABLE + CREATE INDEX |

**Nota de prueba en navegador:** La parte A (carrito) fue validada en la sesión anterior. La UI de tracking admin y el historial dinámico requieren arrancar los servicios y hacer una compra real en el navegador.

---

## Pendientes y riesgos

- `CreatedBy` se hardcodea como `"Admin"` desde el frontend. En producción se debería extraer del JWT del admin logueado.
- No hay validación de estados duplicados consecutivos (se puede registrar "Delivering" dos veces seguidas) — correcto para el alcance actual.
- El panel de tracking solo carga una vez por `orderId` (caché en memoria del componente). Si otro admin añade un evento en paralelo, no se verá hasta que se cierre y reabra el panel.
- La Parte F (pruebas manuales en navegador) debe ejecutarse manualmente por el usuario.

---

## Recomendaciones para la siguiente sesión

1. **Siguiente fase:** Fase 15 — inventario por lotes (Supplier, PurchaseOrder, InventoryLot) según PROJECT_MEMORY.md.
2. **Mejora opcional de tracking:** Añadir botón "Refrescar" en el panel de tracking del admin para recargar sin cerrar el panel.
3. **No hay bloqueos críticos.** El stack completo está funcional:
   - Compra → success → carrito limpio ✓
   - Admin ve el pedido al volver a la pestaña ✓
   - `/track?numero=ORD-xxx` muestra historial real (si hay eventos) o timeline estático (si no los hay) ✓
   - Admin puede registrar eventos de seguimiento desde la página de órdenes ✓
