# 04. Frontend web, mobile y admin

## Web pública - Next.js

## Módulos
- home
- catálogo
- PDP
- PLP
- carrito
- checkout
- seguimiento
- auth
- ayuda
- políticas
- blog / contenido SEO
- landing campaigns

## Consideraciones
- SSR / ISR donde aplique
- imágenes optimizadas
- metadata y schema markup
- analytics
- consent management
- loading states
- errores bien manejados

## Mobile - Expo / React Native

## Módulos
- onboarding
- login / registro
- catálogo
- producto
- carrito
- checkout
- tracking
- push notifications
- perfil
- soporte

## Consideraciones
- secure storage para tokens
- deep links
- actualizaciones OTA con gobernanza
- offline básico para wishlist o cache no crítica

## Admin - Next.js

## Módulos
- dashboard
- productos
- inventario
- pedidos
- clientes
- promociones
- facturación
- reportes
- configuración
- usuarios internos
- auditoría

## UI/UX profesional

### Obligatorio
- diseño responsive
- filtros y ordenamiento
- wishlist
- variantes
- estados de stock
- stock bajo / agotado
- checkout corto
- perfil de pedido claro
- estados de error entendibles

### Checkout profesional
- progress indicator
- resumen fijo
- validaciones inline
- dirección exacta obligatoria
- teléfono obligatorio
- email obligatorio si es pago online
- confirmación de contacto
- aceptación de términos
- confirmación final antes de capturar pago

## Dirección exacta

Modelo recomendado:
- país
- departamento
- municipio
- zona / colonia / sector
- calle / avenida
- número de casa / apartamento / referencia
- latitud/longitud opcional
- instrucciones de entrega
- contacto de recepción

No guardar una sola cadena libre como si la dirección fuera un poema. Luego logística te devuelve prosa trágica.
