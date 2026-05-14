# EXECUTION TRACKER — Tienda Online Plan Maestro

Archivo de seguimiento automático del plan de ejecución completo.
Actualizado automáticamente al iniciar y cerrar cada fase.

---

## Fase 12 — Gestión de Imágenes de Producto

| Campo | Valor |
|---|---|
| **Estado** | In Progress |
| **Fecha inicio** | 2026-05-13 |
| **Fecha fin** | — |
| **Commit** | Pendiente |

### Objetivo
Subir y gestionar imágenes desde admin, soportar múltiples imágenes por producto, carrusel/galería en storefront.

### Resumen
- Entidad `ProductImage` creada con campos: id, productId, imageUrl, altText, sortOrder, isPrimary, createdAt.
- Migración SQL `004_add_product_images.sql` creada.
- `AppCommerceContext` actualizado con `ProductImages` DbSet y configuración EF Core.
- `Product.cs` actualizado con propiedad de navegación `Images`.
- `ImageEndpoints.cs` creado con endpoints públicos y admin para CRUD de imágenes.
- `Program.cs` actualizado con `UseStaticFiles()` y `MapImageEndpoints()`.
- `CatalogEndpoints.cs` actualizado: respuestas incluyen imágenes y conteo.
- Estrategia de almacenamiento: archivos locales en `wwwroot/uploads/products/`, URL absoluta construida en request.

### Archivos principales
- `apps/api/src/.../Modules/Catalog/Entities/ProductImage.cs` — nuevo
- `apps/api/src/.../Modules/Catalog/ImageEndpoints.cs` — nuevo
- `infra/db/migrations/004_add_product_images.sql` — nuevo
- `apps/api/src/.../Modules/Commerce/AppCommerceContext.cs` — modificado
- `apps/api/src/.../Modules/Catalog/Entities/Product.cs` — modificado
- `apps/api/src/.../Modules/Catalog/CatalogEndpoints.cs` — modificado
- `apps/api/src/.../Program.cs` — modificado
- `apps/web-admin/lib/api/commerce.ts` — modificado
- `apps/web-admin/app/(admin)/catalog/CatalogView.tsx` — en progreso
- `apps/web-store/lib/api/commerce.ts` — pendiente
- `apps/web-store/components/storefront/ProductImageGallery.tsx` — pendiente
- `apps/web-store/app/product/[slug]/page.tsx` — pendiente

### Validaciones
- [ ] dotnet build correcto
- [ ] dotnet test correcto
- [ ] web-admin typecheck correcto
- [ ] web-store typecheck correcto
- [ ] Pruebas manuales: carga de imagen desde admin
- [ ] Pruebas manuales: galería en storefront

### Bloqueos/Pendientes
- Ninguno crítico detectado.

---

## Fase 13 — Categorías, Marcas y Catálogo Extendido

| Campo | Valor |
|---|---|
| **Estado** | Pending |
| **Fecha inicio** | — |
| **Fecha fin** | — |
| **Commit** | Pendiente |

### Objetivo
CRUD real de categorías, soporte de marcas, producto más completo.

---

## Fase 14 — Inventario Real por Lotes y Entradas de Compra

| Campo | Valor |
|---|---|
| **Estado** | Pending |
| **Fecha inicio** | — |
| **Fecha fin** | — |
| **Commit** | Pendiente |

### Objetivo
Supplier, PurchaseOrder, InventoryReceipt, InventoryLot, trazabilidad por lotes.

---

## Fase 15 — Serialización y Control Individual de Unidades

| Campo | Valor |
|---|---|
| **Estado** | Pending |
| **Fecha inicio** | — |
| **Fecha fin** | — |
| **Commit** | Pendiente |

### Objetivo
InventoryUnit, serial único, validación de no duplicidad, consulta por serial.

---

## Fase 16 — Movimientos de Inventario, Reservas y Descuento Automático

| Campo | Valor |
|---|---|
| **Estado** | Pending |
| **Fecha inicio** | — |
| **Fecha fin** | — |
| **Commit** | Pendiente |

### Objetivo
InventoryMovement, tipos de movimiento, descuento automático al confirmar compra.

---

## Fase 17 — Mejora Operativa del Admin para Inventario

| Campo | Valor |
|---|---|
| **Estado** | Pending |
| **Fecha inicio** | — |
| **Fecha fin** | — |
| **Commit** | Pendiente |

### Objetivo
Vistas admin para categorías, lotes, seriales, movimientos, filtros, búsquedas.

---

## Fase 18 — Pruebas Funcionales Reales y Ajustes de UX

| Campo | Valor |
|---|---|
| **Estado** | Pending |
| **Fecha inicio** | — |
| **Fecha fin** | — |
| **Commit** | Pendiente |

### Objetivo
Levantar proyecto completo, recorrer todos los flujos reales desde navegador, documentar resultados.

---

*Última actualización: 2026-05-13*
