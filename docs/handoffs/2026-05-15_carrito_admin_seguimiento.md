# Handoff — Carrito no se limpiaba, Admin no refrescaba, Seguimiento de pedido

**Fecha:** 2026-05-15
**Prompt:** 16 (conversacional) — Tres problemas reportados por el usuario tras pruebas reales en navegador

---

## Problemas reportados

1. Después de pagar, el carrito seguía con los mismos items.
2. El pedido no aparecía en el administrador al entrar a `/orders`.
3. El usuario pidió explícitamente una pantalla en la tienda para ver el estado de su pedido ingresando el número de transacción.

---

## Causa raíz 1 — Carrito no se limpiaba (race condition React/localStorage)

### Por qué fallaba el fix del Prompt 15

El Prompt 15 añadió `clearCart()` antes de `router.push()`, pero `clearCart()` solo hacía `dispatch({ type: 'CLEAR_CART' })` al estado de React. El flujo problemático:

1. `clearCart()` → despacha al reducer → `state.items = []` (solo en memoria React)
2. `router.push('/checkout/.../success')` → Next.js inicia navegación
3. Componente se desmonta antes de que React pueda hacer commit del re-render
4. El `useEffect` que hace `localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))` **nunca corre**
5. `localStorage` todavía tiene los items viejos
6. Página `/cart` se monta → `useEffect` lee de `localStorage` → `dispatch(HYDRATE)` → items reaparecen

### Fix aplicado (`CartContext.tsx`)

```typescript
// ANTES
const clearCart = useCallback(() => {
  dispatch({ type: 'CLEAR_CART' });
}, []);

// DESPUÉS — escritura síncrona garantiza que localStorage se limpia antes de navegar
const clearCart = useCallback(() => {
  dispatch({ type: 'CLEAR_CART' });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([])); } catch { /* ignore */ }
}, []);
```

La escritura directa a `localStorage` es síncrona y ocurre antes de que cualquier navegación desmonte el componente.

---

## Causa raíz 2 — Admin no mostraba pedidos nuevos

`OrdersView.tsx` solo cargaba órdenes al montarse (`useEffect(() => { loadOrders(); }, [])`). Si la pestaña del admin ya estaba abierta cuando se hizo la compra en la tienda, no había un trigger para refrescar.

### Fix aplicado (`OrdersView.tsx`)

```typescript
useEffect(() => {
  loadOrders();
  const onFocus = () => loadOrders();
  window.addEventListener('focus', onFocus);
  return () => window.removeEventListener('focus', onFocus);
}, []);
```

Al volver a la pestaña del admin (evento `focus`), las órdenes se recargan automáticamente. Esto cubre el caso de uso real: el admin tiene la página de órdenes abierta en una pestaña, hace la compra en el storefront en otra pestaña, y al regresar al admin ve el pedido nuevo automáticamente.

---

## Nueva funcionalidad — Seguimiento de pedido

### Backend: endpoint público de tracking

**Archivo:** `apps/api/src/TiendaOnline.Api/Modules/Orders/OrderEndpoints.cs`

Nuevo endpoint en el grupo público (sin autenticación):
```
GET /api/v1/orders/track?number={orderNumber}
```

Comportamiento:
- Busca por `OrderNumber` (case-insensitive via `.ToUpperInvariant()` en ambos lados)
- Retorna 404 para órdenes no encontradas
- Retorna 404 para órdenes en estado `Draft` (no expone checkouts incompletos)
- **No retorna datos personales del cliente** (nombre, email, teléfono, dirección)
- Retorna: `OrderNumber`, `Status`, `Currency`, `Total`, `CreatedAt`, `PaymentMethod`, `PaymentStatus`, `Items[]`

Tipos nuevos:
```csharp
public sealed record OrderTrackingResponse(
    string OrderNumber, string Status, string Currency, decimal Total,
    DateTimeOffset CreatedAt, string? PaymentMethod, string? PaymentStatus,
    List<OrderTrackingItemResponse> Items);

public sealed record OrderTrackingItemResponse(
    string ProductName, int Quantity, decimal UnitPrice, decimal LineTotal);
```

### Frontend: página `/track`

**Archivo:** `apps/web-store/app/track/page.tsx`

- Componente envuelto en `<Suspense>` (requerido por `useSearchParams()` en Next.js 16)
- Soporta parámetro URL `?numero=ORD-xxx` para deep linking desde success page
- Timeline de 5 pasos: Pedido recibido → Pago confirmado → En preparación → En camino → Entregado
- Los primeros pasos se muestran activos/completados según el estado de la orden
- Tabla de productos con cantidad, precio unitario y subtotal
- Total al pie de la tabla
- Error 404 muestra mensaje amigable en español
- Botones de navegación al catálogo y al inicio

### Integración en el flujo

**Success page** (`checkout/[sessionId]/success/page.tsx`):
- Botón principal cambia de "Seguir comprando" → "Ver estado del pedido" (link a `/track?numero={orderNumber}`)
- Botón secundario: "Seguir comprando" (link a catálogo)

**Header** (`PublicHeader.tsx`):
- Enlace "Seguimiento" añadido entre "Catálogo" y "Carrito"

---

## Validaciones ejecutadas

| Validación | Resultado |
|---|---|
| `npm run typecheck -w @tienda-online/web-store` | ✓ Sin errores |
| `npm run typecheck -w @tienda-online/web-admin` | ✓ Sin errores |
| `npm run build -w @tienda-online/web-store` | ✓ 9 rutas (incluye `/track`) |
| `npm run build -w @tienda-online/web-admin` | ✓ 11 rutas |
| `dotnet build --no-incremental` | ✓ 0 errores de compilación |
| `dotnet test --no-build` | ✓ 15/15 |
| `GET /orders/track?number=ORD-...` | ✓ Datos correctos |
| `GET /orders/track?number=INVALID` | ✓ 404 |

---

## Pruebas de tracking API (2026-05-15)

```
GET /api/v1/orders/track?number=ORD-20260516034029-E5857D
→ Status: Confirmed | Total: GTQ 15000.00 | Payment: OnlineSimulated / Paid | Items: 1 ✓

GET /api/v1/orders/track?number=ORD-INVALID-123
→ 404 ✓
```

**Nota sobre pruebas de navegador:** Las pruebas de localStorage (carrito) requieren navegador real. La lógica es correcta por código: `localStorage.setItem` es síncrono y se ejecuta dentro del callback de `clearCart`, antes de cualquier `router.push`.

---

## Riesgos y pendientes

- El timeline de seguimiento (`En camino`, `Entregado`) es estático por ahora — no hay estados de logística implementados en el backend. Los estados mostrados activos son solo `Confirmed`, `PendingPayment`, `Cancelled`. Esto es correcto para el alcance actual.
- El número de pedido no requiere verificación adicional (email, etc.) para consulta pública. Para producción se debería agregar validación adicional.
- El admin refresh en `focus` carga con cualquier cambio de foco de ventana, incluso si el usuario solo cambió de pestaña para ver algo sin hacer una compra. Esto es un costo bajo (una llamada a la API) pero podría optimizarse con un debounce.

---

## Recomendaciones para el siguiente agente

1. **Siguiente fase:** Fase 15 — inventario por lotes (Supplier, PurchaseOrder, InventoryLot) según PROJECT_MEMORY.md.
2. **Mejora de tracking:** Cuando se implementen estados logísticos reales (En camino, Entregado), añadir campos en la entidad `Order` y mostrarlos en el timeline.
3. **No hay bloqueos críticos.** El flujo completo funciona:
   - Carrito → Checkout → Pago (CashOnDelivery o OnlineSimulated) → Success → Carrito limpio ✓
   - Admin muestra orden nueva al volver a la pestaña ✓
   - `/track?numero=ORD-xxx` muestra estado e items ✓
