# Handoff: Pruebas Locales End-to-End (Prompt 10 — 2026-05-13)

## Contexto recibido

- Prompt 9 completado (commit b603a8a): hardening, observabilidad, QA, mejoras visuales con íconos
- Prompt 10 agrega Parte F: levantar el proyecto localmente y validar desde la web
- Docker Desktop NO estaba corriendo en este entorno — sin PostgreSQL ni Redis disponibles

## Servicios levantados

| Servicio | Puerto | Estado | Notas |
|---|---|---|---|
| Backend API | 8080 | ✅ Corriendo | InMemory DB via `Database__UseInMemoryForTesting=true` |
| Mock FEL/SAT | 5153 | ✅ Corriendo | `dotnet run --urls http://localhost:5153` |
| Web-store | 3000 | ✅ Corriendo | `npm run dev -w @tienda-online/web-store` |
| Web-admin | 3001 | ✅ Corriendo | `npm run dev -w @tienda-online/web-admin` |
| PostgreSQL | 5432 | ❌ No disponible | Docker Desktop no iniciado |
| Redis | 6379 | ❌ No disponible | Docker Desktop no iniciado |

**Nota crítica sobre InMemory DB**: Al usar `Database__UseInMemoryForTesting=true`, el backend corre con EF Core InMemory. Los datos (órdenes, facturas) no persisten entre reinicios. Para producción o integración real, se requiere PostgreSQL.

## Bugs detectados y corregidos durante pruebas manuales

### Bug 1: Binario API desactualizado al reiniciar
- **Síntoma**: La validación de cantidad=0 retornaba 200 en lugar de 400
- **Causa**: El backend estaba corriendo con el binario previo a los cambios del Prompt 9
- **Fix**: Se mató el proceso en puerto 8080 y se reinició con `dotnet run` (compila fresco)
- **Verificación**: Después del reinicio, cantidad=0 → 400 ✅

### Bug 2: Link `/billing` en Sidebar sin página existente
- **Síntoma**: El link a Facturación en el Sidebar generaría 404
- **Causa**: El Prompt 9 agregó el link pero no la página
- **Fix**: Creada `app/(admin)/billing/page.tsx` con información clara del módulo en construcción

### Bug 3: Ruta `/billing` no protegida por proxy.ts
- **Síntoma**: `GET /billing` retornaba 200 sin token (debería redirigir a /login)
- **Causa**: `/billing` no estaba en `PROTECTED_PREFIXES` en `proxy.ts`
- **Fix**: Agregado `/billing` al array de prefijos protegidos
- **Verificación**: `curl -I http://localhost:3001/billing` → `307 /login?next=%2Fbilling` ✅

## Pruebas manuales ejecutadas (equivalente browser)

### A. Health y sistema
```
GET /health → "Healthy" ✅
GET /api/v1/system/info → {"environment":"Development",...} ✅
X-Correlation-Id en headers → "81d634ec42bd" ✅
```

### B. Catálogo público
```
GET /api/v1/catalog/products → 3 productos:
  - Carry Everyday Backpack | GTQ 425.00 | stock=6
  - Smart Desk Light | GTQ 179.00 | stock=9
  - Starter Office Kit | GTQ 299.00 | stock=18
GET /api/v1/catalog/products/starter-office-kit → detalle completo ✅
```

### C. Rutas protegidas (admin)
```
GET /api/v1/admin/ping (sin token) → 401 ✅
GET /api/v1/admin/orders (sin token) → 401 ✅
GET http://localhost:3001/billing (sin cookie) → 307 /login ✅
GET http://localhost:3001/dashboard (sin cookie) → 307 /login ✅
```

### D. Login admin
```
POST /api/v1/auth/dev/token {"username":"admin-dev","role":"Admin"}
→ token JWT (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...) ✅
GET /api/v1/admin/ping (con token) → {"status":"ok","message":"Admin endpoint reached.","user":"admin-dev","role":"Admin"} ✅
GET /api/v1/admin/orders (con token) → 200 ✅
```

### E. Validaciones de hardening
```
POST /api/v1/checkout/sessions {"items":[{"productId":"...","quantity":0}]} → 400 ✅
POST /api/v1/checkout/sessions {"items":[{"productId":"...","quantity":-1}]} → 400 ✅
PUT /api/v1/checkout/sessions/{id}/customer {"customerEmail":"invalid","customerName":"","phone":"","address":""} → 400 ✅
```

### F. Flujo checkout CashOnDelivery
```
POST /api/v1/checkout/sessions → Session ID: 68757a5c..., Order: e844df47... ✅
PUT /checkout/sessions/.../customer → 200 ✅
POST /checkout/sessions/.../payment-method {"paymentMethod":"CashOnDelivery"} → {"orderStatus":"Confirmed"} ✅
```

### G. Flujo checkout OnlineSimulated + pago
```
POST /api/v1/checkout/sessions → Session: f710f42f, Order: 4e4f19d4 ✅
PUT customer data → 200 ✅
POST payment-method {"paymentMethod":"OnlineSimulated"} → {"paymentAttemptId":"20c0a3cb...","orderStatus":"PendingPayment"} ✅
POST /api/v1/payments/simulate {"success":true} → {"paymentStatus":"Paid","orderStatus":"Confirmed"} ✅
```

### H. Flujo de facturación mock FEL
```
POST /api/v1/admin/orders/{id}/invoices (con token Admin) →
  {"status":"Emitted","uuid":"36e11b5143004c638d388e89eea676bb","satSignature":"MOCK-SAT-36e11b514300",...} ✅
GET /api/v1/orders/{id}/invoices → factura emitida visible ✅
```

### I. Frontends
```
GET http://localhost:3000/ → 200 web-store ✅
GET http://localhost:3000/catalog → 200 (2 SVG icons detectados) ✅
GET http://localhost:3000/cart → 200 ✅
GET http://localhost:3000/product/starter-office-kit → 200 ✅
GET http://localhost:3001/ → 307 /dashboard (Next.js redirect) ✅
GET http://localhost:3001/login → 200 (formulario de login) ✅
GET http://localhost:3001/billing → 307 /login (protegido) ✅
```

## Limitaciones del entorno local

1. **Sin Docker/PostgreSQL**: Los datos no persisten entre reinicios del backend. Para desarrollo real, levantar Docker primero.
2. **Sin Redis**: La salud de readiness (`/health/ready`) reportará servicios degradados. La liveness (`/health`) funciona.
3. **Mock FEL en memoria**: Las facturas registradas en el mock se pierden al reiniciar el proceso.
4. **Sin navegador gráfico real**: Las pruebas se realizaron via HTTP requests (equivalente funcional al browser). Los estilos CSS y la interactividad React no se pudieron verificar visualmente.
5. **Caracteres especiales en bash**: Los nombres con tildes/acentos (ej: `María García`) pueden causar problemas de codificación en curl desde bash de Windows. Usar solo ASCII en pruebas de script.

## Archivos creados o modificados

- `apps/web-admin/app/(admin)/billing/page.tsx` — nuevo: placeholder de facturación
- `apps/web-admin/proxy.ts` — `/billing` agregado a rutas protegidas

## Validaciones ejecutadas (Prompt 10)

| Validación | Resultado |
|---|---|
| `dotnet test` | 15/15 pasando |
| `typecheck` web-admin | limpio |
| `typecheck` web-store | limpio |
| `build` web-admin | limpio (11 rutas generadas) |
| Backend /health | Healthy |
| Catálogo público | 3 productos correctos |
| Login admin (token) | Funcional |
| Rutas sin auth | 401/307 correcto |
| Checkout CashOnDelivery | Orden Confirmed |
| Checkout OnlineSimulated | Paid → Confirmed |
| Factura mock FEL | Status=Emitted |
| Validación qty=0 | 400 correcto |
| Correlation ID | X-Correlation-Id en headers |
| /billing protegido | 307 → /login |

## Recomendaciones para el siguiente agente

1. **Levantar Docker antes de iniciar la API** para usar PostgreSQL real y datos persistentes.
2. **La página `/billing` es un placeholder** — cuando se implemente la gestión centralizada de facturas, reemplazar `app/(admin)/billing/page.tsx` con la vista real.
3. **Testing de UI visual real**: Abrir `http://localhost:3000` y `http://localhost:3001` en el navegador para validar estilos CSS, responsive design e interactividad React.
4. **Siguiente paso de negocio**: Implementar gestión de clientes (página `/customers` ya existe como placeholder) y autenticación real de clientes en el storefront.
5. **Monitoreo con Docker activo**: Cuando Docker esté disponible, validar `/health/ready` contra PostgreSQL y Redis reales.
