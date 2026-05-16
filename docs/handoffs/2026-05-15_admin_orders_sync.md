# Handoff — Diagnóstico y Corrección del Sync de Pedidos en Admin

**Fecha:** 2026-05-15
**Prompt:** 14 — Diagnóstico y corrección: órdenes del storefront no se reflejan correctamente en admin

---

## Contexto recibido

Después de completar el flujo de checkout en el storefront, las órdenes confirmadas no aparecían correctamente en la página `/orders` del panel administrativo. El síntoma visible era una mezcla de filas con datos completos y filas con campos vacíos (`customerName`, `email`, `phone`, `address`).

---

## Diagnóstico — Causa raíz

### Problema 1: Admin endpoint devuelve órdenes Draft

**Endpoint afectado:** `GET /api/v1/admin/orders/`

**Backend (`OrderEndpoints.cs`, línea ~98):**
```csharp
// ANTES — sin filtro, devuelve TODAS las órdenes
var orders = await dbContext.Orders
    .AsNoTracking()
    .Include(order => order.Items)
    .Include(order => order.PaymentAttempts)
    .Include(order => order.Invoices)
    .OrderByDescending(order => order.CreatedAt)
    .Select(order => order.ToResponse())
    .ToListAsync();
```

El flujo de checkout crea una orden en estado `Draft` cuando se inicia una sesión (`POST /api/v1/checkout/sessions`). Si el usuario abandona antes de completar el pago, la orden queda en `Draft` con todos los campos de cliente vacíos. Estas órdenes "fantasma" eran devueltas al admin junto con las órdenes reales, haciendo que la tabla luciera rota.

**Validación previa:** De 10 órdenes en BD, 7 eran `Confirmed` con datos reales y 3 eran `Draft` con campos vacíos.

### Problema 2: `apiFetch` de web-admin sin manejo defensivo

**Archivo:** `apps/web-admin/lib/api/client.ts`

```typescript
// ANTES — misma vulnerabilidad que ya se corrigió en web-store
return response.json() as Promise<T>;
```

Idéntico al bug corregido en Prompt 13 (Tarea 16). No causaba error inmediato en este flujo específico (el endpoint devuelve JSON válido), pero era una bomba de tiempo para cualquier endpoint que retorne 204 o body vacío.

---

## Correcciones aplicadas

### 1. Backend: filtrar órdenes Draft del endpoint admin

**Archivo:** `apps/api/src/TiendaOnline.Api/Modules/Orders/OrderEndpoints.cs`

```csharp
// DESPUÉS — excluye Draft (sesiones de checkout incompletas)
var orders = await dbContext.Orders
    .AsNoTracking()
    .Include(order => order.Items)
    .Include(order => order.PaymentAttempts)
    .Include(order => order.Invoices)
    .Where(order => order.Status != OrderStatuses.Draft)  // ← nueva línea
    .OrderByDescending(order => order.CreatedAt)
    .Select(order => order.ToResponse())
    .ToListAsync();
```

Las órdenes Draft siguen existiendo en BD (son necesarias para el motor de checkout), pero nunca se exponen al admin. Cualquier estado diferente de Draft (`Confirmed`, `PendingPayment`, `Cancelled`) sí se muestra.

### 2. Frontend web-admin: `apiFetch` defensivo

**Archivo:** `apps/web-admin/lib/api/client.ts`

```typescript
// ANTES
return response.json() as Promise<T>;

// DESPUÉS
if (response.status === 204) return undefined as unknown as T;
const text = await response.text();
if (!text) return undefined as unknown as T;
return JSON.parse(text) as T;
```

Mismo patrón que web-store (Tarea 16). Cubre: 204 No Content, 200 con body vacío, 200 con JSON.

### 3. Frontend: mejoras en `OrdersView.tsx`

**Archivo:** `apps/web-admin/app/(admin)/orders/OrdersView.tsx`

Mejoras de calidad (no cambio de comportamiento principal):

- **Tipado correcto:** `err: any` → `err: unknown` con función `errMsg(err: unknown): string`.
- **Botón "Actualizar":** refresh manual siempre visible en la cabecera de la vista.
- **Estado de error recuperable:** muestra el mensaje y un botón "Reintentar" en lugar de error rojo sin acción.
- **Fallbacks de campos vacíos:** `customerName` vacío → `"Sin nombre"` en itálica; `phone`/`email` vacíos → `'—'`.
- **Colores centralizados:** `STATUS_COLORS` y `PAYMENT_COLORS` como mapas constantes — evita inline ternarios anidados.
- **`'—'`** tipográfico en lugar de `-` ASCII para celdas sin datos.

---

## Por qué NO se muestran órdenes Draft en admin

Las órdenes Draft son un artefacto interno del motor de checkout:
- Se crean al iniciar una sesión (`POST /checkout/sessions`).
- Tienen campos de cliente vacíos hasta que el usuario completa el paso de datos de contacto.
- Pasan a `Confirmed` o `PendingPayment` al seleccionar método de pago.
- Si el usuario abandona, quedan en Draft indefinidamente.

Mostrarlas al admin sería confuso y no accionable — no tienen nombre de cliente, email, ni información de pago.

Un proceso de cleanup periódico (tarea futura) puede expirar o eliminar las Draft más antiguas que X horas.

---

## Validaciones ejecutadas

| Validación | Resultado |
|---|---|
| `npm run typecheck -w @tienda-online/web-admin` | ✓ Sin errores |
| `npm run build -w @tienda-online/web-admin` | ✓ Limpio, 11 rutas |
| `dotnet build --no-incremental` API | ✓ 0 errores |
| `dotnet test --no-build` | ✓ 15/15 |

**Nota sobre `dotnet build`:** Se requirió `--no-incremental` porque el MSBuild local trata los targets parciales como error cuando hay archivos de caché obsoletos. Es un quirk del entorno Windows, no un error real del código.

---

## Prueba E2E manual (2026-05-15)

- Servicios: Docker (PG 5433, Redis 6379), API en `http://localhost:8080`.
- `POST /api/v1/auth/dev/token` (`{username:"admin",role:"Admin"}`) → token ✓
- `GET /api/v1/admin/orders/` con JWT → **7 órdenes**, todas `Confirmed`, todos los campos de cliente con datos ✓
- Antes del fix: 10 órdenes (3 Draft con campos vacíos + 7 Confirmed).

---

## Riesgos y pendientes

- Las órdenes Draft en BD seguirán acumulándose con el tiempo. Se recomienda un proceso de cleanup (expirar/eliminar Draft > 24h) en una tarea futura.
- El carrito de localStorage no se limpia al llegar a la página de éxito del checkout. Mejora pendiente: llamar `clearCart()` en `CheckoutSuccessPage` cuando la sesión esté `Completed`.

---

## Recomendaciones para el siguiente agente

1. **Siguiente fase (Fase 15):** Inventario por lotes — `Supplier`, `PurchaseOrder`, `InventoryLot` según la hoja de ruta en `PROJECT_MEMORY.md`.
2. **No hay bloqueos críticos:** flujo completo checkout → admin funcional y validado.
3. **Limpiar carrito en éxito:** en `CheckoutSuccessPage` (client component wrapper), llamar `clearCart()` del `CartContext` cuando `session.status === 'Completed'`.
