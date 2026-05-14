# Handoff — Gestión de Imágenes de Producto y Galería en Storefront (Fase 12)
Fecha: 2026-05-13

## Contexto recibido
El proyecto tenía base funcional completa de catálogo, inventario, pedidos, checkout, pagos simulados y facturación mock. El storefront mostraba placeholders para imágenes. El admin no tenía forma de subir imágenes reales. Se pedía implementar la gestión completa de imágenes de producto.

## Trabajo realizado

### Backend
- **Entidad `ProductImage`** en `Modules/Catalog/Entities/ProductImage.cs` con campos: id (Guid), productId (FK), imageUrl (500 chars), altText (255 chars), sortOrder (int), isPrimary (bool), createdAt.
- **Relación 1:N** `Product → ProductImage` configurada en `AppCommerceContext.cs` con `OnDelete CASCADE`.
- **Migración SQL** `004_add_product_images.sql`: tabla `commerce.product_images` con FK + índice en `product_id`.
- **`ImageEndpoints.cs`**: 5 endpoints REST:
  - `POST /api/v1/admin/catalog/products/{id}/images` — upload multipart/form-data (RequireAdmin)
  - `GET /api/v1/admin/catalog/products/{id}/images` — lista admin (RequireAdmin)
  - `PUT /api/v1/admin/catalog/products/{id}/images/{imgId}/primary` — marcar principal (RequireAdmin)
  - `DELETE /api/v1/admin/catalog/products/{id}/images/{imgId}` — eliminar (RequireAdmin)
  - `GET /api/v1/catalog/products/{id}/images` — lista pública (no auth)
- **Almacenamiento local**: `wwwroot/uploads/products/` con `PhysicalFileProvider` explícito. URLs absolutas construidas desde el request al momento de la subida.
- **`Program.cs`**: `UseStaticFiles` con `PhysicalFileProvider` explícito + creación del directorio en startup.
- **`CatalogEndpoints.cs`**: `PublicCatalogProductSummary` incluye `primaryImageUrl?`, `PublicCatalogProductDetail` incluye `images[]`, `AdminCatalogProductSummary` incluye `imageCount` y `primaryImageUrl?`.

### Frontend Admin (`web-admin`)
- **`lib/api/commerce.ts`**: tipos `ProductImageDto`, `AdminCatalogProductSummary` extendido con `imageCount`/`primaryImageUrl`, funciones `fetchProductImages`, `uploadProductImage`, `setPrimaryProductImage`, `deleteProductImage`.
- **`CatalogView.tsx`**: tabla expandible por producto. Al hacer clic en una fila se muestra panel inline con: lista de imágenes con thumbnail 140px, botones "Principal" y "Eliminar" por imagen, badge "Principal" sobre la imagen activa, upload inline con `<input type="file">` y feedback de estado.

### Frontend Storefront (`web-store`)
- **`lib/api/commerce.ts`**: `ProductImageDto` + campo `images: ProductImageDto[]` en `PublicCatalogProductDetail`.
- **`ProductImageGallery.tsx`** (nuevo componente client): carrusel con flechas ‹/›, puntos de navegación, miniaturas clickeables con borde de selección activo, fallback SVG cuando no hay imágenes.
- **`product/[slug]/page.tsx`**: eliminados placeholders, integrada galería real. Layout preservado.

## Validaciones ejecutadas

| Validación | Resultado |
|---|---|
| `dotnet build` | ✅ Build succeeded |
| `dotnet test` (15 tests) | ✅ 15/15 passed |
| `npm run typecheck -w @tienda-online/web-admin` | ✅ Sin errores |
| `npm run typecheck -w @tienda-online/web-store` | ✅ Sin errores |
| `npm run build -w @tienda-online/web-admin` | ✅ Build correcto |
| `npm run build -w @tienda-online/web-store` | ✅ Build correcto |
| Migración 004 aplicada en PostgreSQL | ✅ Verificado vía Docker |
| Upload imagen POST → HTTP 201 | ✅ Funcionando |
| GET archivo estático → HTTP 200, image/png | ✅ Funcionando |
| Set primary PUT → HTTP 200 | ✅ Funcionando |
| Delete DELETE → HTTP 200 `{deleted:true}` | ✅ Funcionando |
| Public product detail con `images[]` | ✅ Verificado |
| Admin products con `imageCount` | ✅ Verificado |
| web-store `/product/[slug]` → HTTP 200 | ✅ Verificado |
| web-admin `/catalog` → HTTP 200 | ✅ Verificado |

## Servicios levantados y URLs usadas

| Servicio | URL | Estado |
|---|---|---|
| API backend | http://localhost:8080 | ✅ Corriendo |
| PostgreSQL (Docker) | localhost:5433 | ✅ Healthy |
| Redis (Docker) | localhost:6379 | ✅ Healthy |
| web-store | http://localhost:3000 | ✅ Corriendo |
| web-admin | http://localhost:3001 | ✅ Corriendo |

## Decisiones técnicas

1. **PhysicalFileProvider explícito**: `UseStaticFiles` sin argumentos falla si `WebRootPath` es null al startup. Se configuró con `PhysicalFileProvider` apuntando a `ContentRootPath/wwwroot`.
2. **URL completa en DB**: la URL de imagen se construye con el scheme+host del request en el momento del upload. Limitación: cambia si cambia el host. Para producción: migrar a S3 con URL fija.
3. **Primera imagen = principal automático**: lógica en el endpoint de upload.
4. **Al eliminar principal**: siguiente imagen por sortOrder se promueve automáticamente.
5. **Sin dependencias externas**: galería implementada con CSS inline + estado React básico.
6. **`.gitignore`**: uploads ignorados por extensión, `.gitkeep` versionado para mantener estructura de carpetas.

## Problemas encontrados y soluciones

| Problema | Solución |
|---|---|
| `UseStaticFiles()` sin argumentos no servía archivos cuando `WebRootPath = null` | Configurar con `PhysicalFileProvider` explícito + `Directory.CreateDirectory` en startup |
| API process bloqueaba rebuild (archivo en uso) | `Stop-Process -Name "TiendaOnline.Api"` antes de rebuild |

## Limitaciones conocidas

- Imágenes almacenadas localmente: no portables entre entornos, no escalan a producción.
- No hay drag & drop para reordenar imágenes (sortOrder no se actualiza desde la UI).
- No hay compresión ni optimización de imágenes al subir.
- Las URLs almacenadas en DB son absolutas (incluyen localhost:8080).

## Recomendaciones para el siguiente agente

1. Continuar con **Fase 13**: CRUD real de categorías (actualmente las categorías se crean on-the-fly como string) y soporte de marcas.
2. Para Fase 14 (inventario por lotes), crear entidades `Supplier`, `PurchaseOrder`, `InventoryLot` con migración 005.
3. Para producción futura: migrar `uploadProductImage` a S3 cambiando solo el endpoint de upload (el contrato de URL en DB se mantiene).
4. El módulo de imágenes quedó aislado en `ImageEndpoints.cs` — fácil de extender.
5. Ejecutar `docker compose up -d` antes de iniciar el proyecto para PostgreSQL y Redis.
