# Handoff — Storefront Real y Carrito Funcional

**Fecha:** 2026-05-14  
**Fase:** 14 — Refinamiento del Storefront, Funcionalidad Real del Carrito y Pruebas desde la Web  
**Rama:** main  
**Commit anterior:** 96ba2f6 — chore: remove JWT secret from git and show primary image in product cards

---

## Contexto recibido

- Proyecto en fase de desarrollo — sin Docker obligatorio en esta fase.
- Storefront (`apps/web-store`) operativo pero incompleto: carrito era un placeholder, no había botones de "Agregar al carrito", la home tenía texto de placeholder.
- Backend API en `apps/api` con módulos de catálogo, checkout, pagos y facturación.
- El JWT secret había sido removido del repositorio por seguridad → esto dejó la API rota al iniciar.

---

## Trabajo realizado

### Problema crítico resuelto: API rota por JWT secret vacío
- `appsettings.Development.json` no existía → `SecretKey` era `""` → error `IDX10703: key length is zero` en cada request.
- Creado `appsettings.Development.json` (ya estaba en `.gitignore`) con:
  - `Auth.SecretKey`: clave de desarrollo local
  - `Database.UseInMemoryForTesting: true`
  - `Database.SeedDevelopmentData: true`
- La API ahora arranca correctamente sin Docker.

### Corrección de `global.json`
- `global.json` pedía SDK `10.0.103` con `rollForward: latestFeature`.
- SDK disponible en el entorno: `10.0.102`. `latestFeature` no hace rollback, solo avanza.
- Actualizado a `version: 10.0.102` — mantiene `rollForward: latestFeature` para compatibilidad futura.

### CartContext — Estado real del carrito
**Archivo:** `apps/web-store/lib/cart/CartContext.tsx`
- React Context + `useReducer` para estado inmutable.
- Persiste en `localStorage` (clave `tienda_cart`).
- Acciones: `ADD_ITEM`, `REMOVE_ITEM`, `UPDATE_QUANTITY`, `CLEAR_CART`, `HYDRATE`.
- `ADD_ITEM` incrementa cantidad si el producto ya existe (evita duplicados).
- `UPDATE_QUANTITY` con cantidad <= 0 elimina el item.
- Computed values expuestos: `totalItems`, `subtotal`, `currency`.
- `CartProvider` envuelve el layout raíz en `app/layout.tsx`.

### AddToCartButton — Botón reutilizable
**Archivo:** `apps/web-store/components/storefront/AddToCartButton.tsx`
- Variante `card`: aparece en tarjetas del catálogo como link con texto "+ Agregar".
- Variante `detail`: aparece en detalle de producto como botón primario full-width.
- Feedback visual de 1.4 segundos ("✓ Agregado") al agregar.
- Muestra "Agotado" (deshabilitado) si `inStock === false`.

### ProductCard — Con botón Agregar
**Archivo:** `apps/web-store/components/storefront/ProductCard.tsx`
- Imagen clickeable → enlace a detalle.
- Botón "+ Agregar" junto al link "Ver".
- Badge de stock usa color rojo para agotado.

### CartView — Carrito funcional real
**Archivo:** `apps/web-store/components/storefront/CartView.tsx`
- Estado vacío: icono + mensaje + CTA a catálogo.
- Lista de items: imagen, nombre (link al producto), precio unitario.
- Control de cantidad: botones `-` y `+` por item.
- Eliminar item individual con ícono de papelera.
- Botón "Vaciar carrito" para limpiar todo.
- Sidebar sticky con resumen: items × cantidad → subtotal → total.
- Botón "Proceder al checkout" → crea sesión con todos los items → redirige a `/checkout/[sessionId]`.
- Manejo de error de checkout visible al usuario.

### cart/page.tsx — Simplificado
- Ya no usa `getAllProducts()` ni el antiguo `CartOrderBase`.
- Solo renderiza `<CartView />`.

### product/[slug]/page.tsx — CTA real
- Botón "Agregar al carrito" (variante `detail`) con `AddToCartButton`.
- Botón "Ver carrito" como secundario.
- Breadcrumb: Inicio › Catálogo › Nombre del producto.
- Panel de detalles: stock, SKU, categoría, marca, unidades disponibles.
- Precio grande y destacado.
- Descripción del producto al final del panel.

### PublicHeader — Badge de carrito
- Convertido a `'use client'` para acceder a `useCart()`.
- Badge numérico en el link de carrito, visible solo cuando `totalItems > 0`.
- Texto de marca cambiado de "Storefront" a "Mi Tienda".

### Home page — Sin texto placeholder
- Hero: "Encuentra lo que necesitas, sin complicaciones."
- Si hay productos del catálogo: muestra grid de destacados.
- Si no hay productos (API caída): muestra estado vacío con link al catálogo.
- Info grid: Catálogo, Carrito, Pago — con CTAs reales.

### Footer — Texto actualizado
- Texto: "Tu tienda en línea. Catálogo, carrito y checkout."

### StorefrontContainer — Acepta `style` prop
- Agregada prop opcional `style?: CSSProperties`.

### globals.css — Estilos nuevos
- Carrito: `.cart-layout`, `.cart-item`, `.cart-item-qty`, `.qty-btn`, `.cart-summary`, `.cart-total-row`, `.cart-error`.
- Producto detalle: `.product-panel-title`, `.product-price-large`, `.product-info-row`, `.product-panel-divider`.
- Header badge: `.nav-cart-link`, `.cart-badge`.
- Breadcrumb: `.breadcrumb`.
- Hero simplificado: `.hero-simple`.
- Empty state: `.empty-state-icon`.

---

## Validaciones ejecutadas

| Validación | Resultado |
|---|---|
| `npm run typecheck:web-store` | ✓ Sin errores |
| `npm run build:web-store` | ✓ Build exitoso (warnings de baseline-browser-mapping esperados) |
| GET / | ✓ 200 — texto actualizado, productos seed visibles |
| GET /catalog | ✓ 200 — 3 productos, botón "Agregar" renderizado |
| GET /product/carry-everyday-backpack | ✓ 200 — precio 425, CTA "Agregar al carrito", breadcrumb |
| GET /product/smart-desk-light | ✓ 200 |
| GET /product/starter-office-kit | ✓ 200 |
| GET /cart | ✓ 200 — estado vacío correcto (SSR) |
| GET /account | ✓ 200 |
| API /health | ✓ 200 Healthy |
| API /api/v1/catalog/products | ✓ 200, 3 productos seed |
| POST /api/v1/checkout/sessions | ✓ Session creada, order generado |
| GET /checkout/[sessionId] | ✓ 200 |

**Servicios levantados para pruebas:**
- API: `http://localhost:8080` — dotnet con InMemory DB + seed data
- web-store: `http://localhost:3000` — Next.js dev mode

---

## Problemas encontrados

1. **API rota por JWT secret vacío**: resuelto con `appsettings.Development.json` (ignorado por git).
2. **`global.json` con SDK no disponible**: `10.0.103` → `10.0.102`.
3. **Node version mismatch**: Node 20.19.6 disponible vs 22.13.1 requerido → `npm install --engine-strict=false`.
4. **`node_modules` no existían**: instalación requerida al inicio de la sesión.
5. **Pruebas de interacción client-side**: el carrito es client-side (localStorage), las pruebas HTTP confirman SSR correcto pero no validan clicks — requieren navegador real.

---

## Archivos creados o modificados

**Nuevos:**
- `apps/web-store/lib/cart/CartContext.tsx`
- `apps/web-store/components/storefront/AddToCartButton.tsx`
- `apps/web-store/components/storefront/CartView.tsx`
- `apps/api/src/TiendaOnline.Api/appsettings.Development.json` _(excluido de git)_

**Modificados:**
- `apps/web-store/app/layout.tsx` — CartProvider
- `apps/web-store/app/page.tsx` — home sin placeholders
- `apps/web-store/app/cart/page.tsx` — usa CartView
- `apps/web-store/app/product/[slug]/page.tsx` — CTA real, breadcrumb
- `apps/web-store/app/globals.css` — ~200 líneas de estilos nuevos
- `apps/web-store/components/storefront/ProductCard.tsx` — AddToCartButton
- `apps/web-store/components/storefront/PublicHeader.tsx` — client, badge
- `apps/web-store/components/storefront/PublicFooter.tsx` — texto actualizado
- `apps/web-store/components/storefront/StorefrontContainer.tsx` — prop style
- `global.json` — SDK 10.0.102

---

## Recomendaciones para el siguiente agente

1. **Autenticación de clientes**: el storefront no tiene login — los clientes solo identifican por nombre/email en checkout. Considerar auth real cuando se quiera historial de pedidos.

2. **Carrito en backend**: actualmente solo en localStorage. Para sesiones cross-device o recuperación de carrito, persistir en Redis o DB con un ID de sesión.

3. **Catálogo sin filtros**: el catálogo público muestra todos los productos sin filtro por categoría/marca. Agregar filtros mejoraría UX significativamente.

4. **`appsettings.Development.json` para desarrollo**: el archivo existe localmente pero está en `.gitignore`. Cualquier nuevo desarrollador necesita crearlo. Considerar documentar en `docs/01_setup_local.md`.

5. **Pruebas E2E con navegador real**: las pruebas HTTP confirman SSR y API, pero el flujo completo de carrito (agregar → ver badge → checkout) requiere Playwright o prueba manual real en navegador.

6. **`CartOrderBase.tsx`**: el componente antiguo (`apps/web-store/components/storefront/CartOrderBase.tsx`) ya no se usa — puede eliminarse en limpieza futura.

7. **Módulo de cuenta**: `/account` sigue siendo un placeholder — no hay autenticación de clientes implementada.
