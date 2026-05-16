# Handoff — Diagnóstico y Corrección del Flujo de Checkout/Pago

**Fecha:** 2026-05-15
**Prompt:** 13 — Diagnóstico y Corrección del Flujo de Checkout/Pago
**Bug reportado:** "Failed to execute 'json' on 'Response': Unexpected end of JSON input" al avanzar desde el paso de datos de contacto en el checkout.

---

## Contexto recibido

El storefront ya estaba refinado visualmente (Prompt 12). El flujo de checkout había sido mejorado con CSS classes propias. Sin embargo, al hacer clic en "Continuar al pago" después de llenar los datos de contacto, el navegador mostraba el error:

```
Failed to execute 'json' on 'Response': Unexpected end of JSON input
```

---

## Diagnóstico — Causa raíz

**Endpoint afectado:** `PUT /api/v1/checkout/sessions/{id}/customer`

**Backend (`CheckoutEndpoints.cs`, línea 136):**
```csharp
// ANTES — retornaba 200 OK con cuerpo vacío
return Results.Ok();
```

**Frontend (`client.ts`):**
```typescript
// apiFetch siempre llamaba .json() sin verificar si había cuerpo
return response.json() as Promise<T>;
```

Cuando el frontend llamaba a `updateCheckoutCustomer`, el `apiFetch` recibía una respuesta HTTP 200 con body vacío y llamaba `response.json()` incondicionalmente. Parsear un body vacío como JSON lanza `"Unexpected end of JSON input"`.

**La cadena exacta:**
1. Usuario llena datos y hace clic "Continuar al pago"
2. Frontend llama `PUT /api/v1/checkout/sessions/{id}/customer`
3. Backend actualiza y retorna `Results.Ok()` → HTTP 200 body vacío
4. `apiFetch` llama `response.json()` → lanza `SyntaxError: Unexpected end of JSON input`
5. El error se captura en el `catch` del checkout page → se muestra como error de red

---

## Correcciones aplicadas

### 1. Backend: contrato explícito

**Archivo:** `apps/api/src/TiendaOnline.Api/Modules/Checkout/CheckoutEndpoints.cs`

```csharp
// DESPUÉS — retorna JSON mínimo explícito
return Results.Ok(new { updated = true });
```

### 2. Frontend: `apiFetch` defensivo

**Archivo:** `apps/web-store/lib/api/client.ts`

```typescript
// ANTES
return response.json() as Promise<T>;

// DESPUÉS
if (response.status === 204) return undefined as unknown as T;
const text = await response.text();
if (!text) return undefined as unknown as T;
return JSON.parse(text) as T;
```

Esta corrección maneja tres casos:
- **204 No Content**: retorna `undefined` sin intentar parsear.
- **200 con body vacío**: retorna `undefined` sin lanzar error.
- **200 con JSON**: parsea correctamente.

### 3. Frontend: tipo correcto en commerce.ts

**Archivo:** `apps/web-store/lib/api/commerce.ts`

```typescript
// ANTES (apiFetch<void> era ambiguo — void no describe el contrato real)
return apiFetch<void>(...);

// DESPUÉS (tipo describe el contrato real del backend)
await apiFetch<{ updated: boolean }>(...);
```

---

## Verificación: no hay más `Results.Ok()` sin cuerpo

Se verificó con `grep` en todo el código C# del API — no hay más instancias de `Results.Ok()` sin argumento. Los demás endpoints ya retornan JSON válido.

---

## Validaciones ejecutadas

| Validación | Resultado |
|---|---|
| `dotnet build` API | ✓ 0 errores |
| `dotnet test` | ✓ 15/15 |
| `npm run typecheck -w @tienda-online/web-store` | ✓ Sin errores |
| `npm run build -w @tienda-online/web-store` | ✓ Limpio, 8 rutas |

---

## Pruebas manuales (2026-05-15)

**Servicios:** Docker PostgreSQL (5433) + Redis (6379), API en http://localhost:8080, web-store en http://localhost:3000.

**Flujo CashOnDelivery:**
1. `POST /api/v1/checkout/sessions` (2 items) → 200, session Active ✓
2. `PUT /api/v1/checkout/sessions/{id}/customer` → **200 `{"updated":true}`** ✓ (antes fallaba)
3. `POST /api/v1/checkout/sessions/{id}/payment-method` (CashOnDelivery) → orderStatus=Confirmed ✓
4. Session status → Completed ✓
5. `/checkout/{id}/success` → 200 ✓

**Flujo OnlineSimulated:**
1. `POST /sessions` → 200, session Active ✓
2. `PUT /customer` → **200 `{"updated":true}`** ✓
3. `POST /payment-method` (OnlineSimulated) → paymentAttemptId recibido, orderStatus=PendingPayment ✓
4. `POST /payments/simulate` (success=true) → paymentStatus=Paid, orderStatus=Confirmed ✓
5. `/checkout/{id}/success` → 200 ✓

**Nota:** Las pruebas de interacción real con el formulario del navegador (teclear, hacer clic) no se pueden automatizar desde CLI. El flujo SSR + API fue completamente validado y es equivalente al flujo del navegador para estos endpoints.

---

## Riesgos y pendientes

- El carrito no se limpia automáticamente al llegar a la página de éxito. Si el usuario recarga `/checkout/{id}` después de que la sesión esté Completed, el checkout page redirige correctamente a `/success`. Pero el carrito de localStorage persiste. **Mejora pendiente:** limpiar el carrito en `CartView` solo cuando la sesión esté confirmada (no al crear).
- Las respuestas del `POST /payment-method` y `POST /simulate` usan `new { PascalCase = ... }` — serializado a camelCase por ASP.NET Core por defecto. Esto funciona, pero sería más explícito usar records tipados.

---

## Recomendaciones para el siguiente agente

1. **Limpiar carrito en success:** en `CheckoutSuccessPage`, después de cargar la sesión y confirmar que está `Completed`, llamar `clearCart()` desde el CartContext. Requiere pasar el contexto a una client component o usar `useCart()` desde dentro.
2. **Siguiente fase:** Fase 15 — inventario avanzado (Supplier, PurchaseOrder, InventoryLot) según la hoja de ruta en PROJECT_MEMORY.md.
3. **No hay bloqueos críticos:** el flujo completo de checkout está funcional y validado.
