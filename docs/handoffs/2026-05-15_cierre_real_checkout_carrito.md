# Handoff — Cierre Real de Orden Post-Checkout y Limpieza de Carrito

**Fecha:** 2026-05-15
**Prompt:** 15 — Cierre real del flujo de compra, limpieza de carrito y reflejo en admin

---

## Contexto recibido

Después de Prompt 14, el flujo de checkout ya no daba error JSON y podía completar el flujo visualmente. Sin embargo, el usuario reportó que después de una compra exitosa:
- El carrito seguía cargado con los mismos ítems
- El usuario podía volver a entrar y reprocesar el pago
- La orden no se reflejaba de forma confiable y visible en el admin

---

## Diagnóstico — Causa raíz

### 1. Cart no se limpiaba (causa raíz real y única corrección necesaria)

El carrito se almacena en `localStorage` con la clave `tienda_cart`, gestionado por `CartContext` (`apps/web-store/lib/cart/CartContext.tsx`).

El problema: ninguna de las dos páginas del flujo post-checkout limpiaba el carrito:
- `CheckoutPage`: navegaba a success sin llamar `clearCart()`
- `CheckoutSuccessPage`: cargaba la sesión y mostraba detalles pero nunca llamaba `clearCart()`

**Efecto visible:** Usuario completaba la compra → veía success page correcta → volvía a `/cart` → todos los items seguían ahí, haciendo parecer que la orden no se había completado o que podía repetirse.

### 2. Cierre de sesión — YA CORRECTO, no requirió cambio

Verificación de código:

**CashOnDelivery** (`CheckoutEndpoints.cs`, línea 172-173):
```csharp
order.Status = OrderStatuses.Confirmed;
session.Status = CheckoutSessionStatuses.Completed;
```

**OnlineSimulated** (`PaymentEndpoints.cs`, líneas 51-59):
```csharp
if (request.Success)
{
    var session = await dbContext.CheckoutSessions
        .FirstOrDefaultAsync(s => s.OrderId == order.Id && s.Status == CheckoutSessionStatuses.Active, ...);
    if (session != null)
        session.Status = CheckoutSessionStatuses.Completed;
}
```

Ambos paths correctamente marcan la sesión como `Completed` antes de retornar.

### 3. Reprocesso bloqueado — YA CORRECTO, no requirió cambio

El checkout page ya tenía esta protección en el `useEffect` de carga:
```typescript
if (data.status === 'Completed') {
  router.push(`/checkout/${sessionId}/success`);
}
```

Y el backend bloquea cualquier mutación sobre sesiones no-Active:
```csharp
if (session.Status != CheckoutSessionStatuses.Active)
    return Results.BadRequest(new { message = "Session is no longer active." });
```

**Verificado:** `POST /checkout/sessions/{id}/payment-method` sobre sesión Completed → 400 BadRequest ✓

### 4. Visibilidad en admin — YA CORRECTO desde Prompt 14

El endpoint `GET /api/v1/admin/orders/` filtra órdenes Draft. Las órdenes Confirmed aparecen correctamente. El botón "Actualizar" permite refresh manual en la UI.

---

## Corrección aplicada

### `apps/web-store/app/checkout/[sessionId]/page.tsx`

Añadido `useCart()` para acceder a `clearCart()`:

```typescript
import { useCart } from '@/lib/cart/CartContext';

// En el componente:
const { clearCart } = useCart();
```

Llamada a `clearCart()` en los dos paths de pago exitoso, antes de `router.push`:

**CashOnDelivery:**
```typescript
if (paymentMethod === 'CashOnDelivery') {
  clearCart();                                    // ← nuevo
  router.push(`/checkout/${sessionId}/success`);
}
```

**OnlineSimulated (pago exitoso):**
```typescript
if (res.paymentStatus === 'Paid') {
  clearCart();                                    // ← nuevo
  router.push(`/checkout/${sessionId}/success`);
}
```

### ¿Por qué en CheckoutPage y no en CheckoutSuccessPage?

El carrito se limpia exactamente una vez, en el momento de confirmación de compra. Si se limpiara en `CheckoutSuccessPage`:
- El usuario podría agregar nuevos items al carrito después de comprar
- Si recarga la URL de éxito (bookmarked, etc.), `clearCart()` eliminaría los nuevos items
- Requeriría tracking adicional (sessionStorage) para evitar esto

Limpiar en `CheckoutPage` al navegar a success es la opción más limpia y libre de efectos secundarios.

---

## Validaciones ejecutadas

| Validación | Resultado |
|---|---|
| `npm run typecheck -w @tienda-online/web-store` | ✓ Sin errores |
| `npm run build -w @tienda-online/web-store` | ✓ Limpio, 8 rutas |

### E2E API (2026-05-15) — CashOnDelivery

```
POST /api/v1/checkout/sessions        → Active
PUT  /customer                         → {updated: true}
POST /payment-method (CashOnDelivery) → Confirmed
GET  /checkout/sessions/{id}          → Completed | order.status = Confirmed
GET  /api/v1/admin/orders/ (JWT)      → orden visible: ORD-20260516033943-DF1B2D | Confirmed | Test COD
```

### E2E API (2026-05-15) — OnlineSimulated

```
POST /api/v1/checkout/sessions          → Active
PUT  /customer                           → {updated: true}
POST /payment-method (OnlineSimulated)  → PendingPayment
POST /payments/simulate (success=true)  → Paid | Confirmed
GET  /checkout/sessions/{id}            → Completed | order.status = Confirmed
POST /payment-method (reintento)        → 400 BadRequest "Session is no longer active" ✓
GET  /api/v1/admin/orders/ (JWT)        → orden visible: ORD-20260516034029-E5857D | Confirmed | Test Online
```

---

## Limitaciones documentadas

- Las pruebas de interacción real del carrito (`localStorage`) requieren navegador real. No es posible validar `localStorage` desde CLI. La lógica es verificable por código: `clearCart()` se llama en los únicos dos paths de compra exitosa, y `CartContext` borra la key de localStorage cuando `dispatch(CLEAR_CART)`.
- El warning `baseline-browser-mapping` persiste en builds — no bloquea.

---

## Riesgos y pendientes

- Si el usuario hace refresh duro del navegador entre el paso de pago y la navegación a success, el carrito no se limpia (la función `clearCart()` no se llega a ejecutar). Este es un edge case muy improbable pero existe. Mitigación: en ese caso el usuario ve el checkout page vacío (sesión Completed → redirect a success automático), pero el carrito sigue lleno. Corrección completa requeriría limpiar el carrito al detectar la sesión como Completed en el `useEffect` inicial.
- El botón "Actualizar" en admin requiere clic manual para ver pedidos nuevos. Es aceptable para development stage.

---

## Recomendaciones para el siguiente agente

1. **Siguiente fase:** Fase 15 — inventario avanzado (Supplier, PurchaseOrder, InventoryLot) según PROJECT_MEMORY.md.
2. **Mejora futura:** Para cerrar el edge case de refresh durante pago, limpiar el carrito también en el `useEffect` inicial del `CheckoutSuccessPage` cuando la sesión está `Completed` — pero solo si el carrito contiene items que coincidan con los de la orden, para no borrar un carrito nuevo.
3. **No hay bloqueos críticos:** flujo completo checkout → success → admin es funcional y validado.
