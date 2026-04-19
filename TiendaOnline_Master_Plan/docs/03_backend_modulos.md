# 03. Backend y módulos

## Stack backend

- ASP.NET Core Web API
- Entity Framework Core + Npgsql
- PostgreSQL
- Redis
- OpenAPI/Swagger
- Background jobs
- Object storage
- observabilidad con logs estructurados y tracing

## Módulos

### 1. Auth
- registro
- login
- refresh tokens
- guest session
- verificación de email
- verificación de teléfono
- recuperación de cuenta
- MFA opcional para admin

### 2. Customers
- perfil
- direcciones
- preferencias
- historial
- contactos

### 3. Catalog
- productos
- variantes
- categorías
- atributos
- marcas
- galerías
- SEO metadata

### 4. Inventory
- stock por bodega
- reservas temporales
- movimientos
- ajustes
- lotes si aplica
- umbrales mínimos

### 5. Cart
- carrito guest
- carrito usuario
- merge guest->usuario
- cupones
- cálculo preliminar

### 6. Checkout
- dirección
- entrega
- pago
- validaciones
- antifraude básico
- confirmación

### 7. Orders
- creación de orden
- estados
- timeline
- cancelaciones
- devoluciones parciales
- reintentos de pago

### 8. Payments
- intento de pago
- tokenización / session del PSP
- webhook handling
- conciliación
- pago contra entrega
- reembolso

### 9. Shipping
- zonas
- tarifas
- promesas de entrega
- couriers
- tracking

### 10. Promotions
- cupones
- descuentos por categoría
- descuentos por carrito
- bundles
- reglas

### 11. Notifications
- email transaccional
- SMS
- push
- plantillas
- reintentos

### 12. Invoicing / FEL
- generación de documento interno
- adapter a certificador
- acuses
- reintentos
- anulación
- reenvío al cliente

### 13. Admin
- dashboard
- usuarios internos
- roles
- bitácora
- catálogo
- inventario
- pedidos
- facturación

### 14. Audit
- acciones críticas
- cambios en precios
- cambios en stock
- cambios en pedidos
- exportable para revisiones

## Entidades base

- users
- roles
- permissions
- customers
- addresses
- phone_verifications
- email_verifications
- products
- product_variants
- product_images
- categories
- warehouses
- stock_items
- stock_movements
- carts
- cart_items
- orders
- order_items
- payment_attempts
- payment_transactions
- shipments
- shipment_events
- invoices
- fel_documents
- fel_submissions
- notification_jobs
- audit_logs

## Consideraciones clave

### Guest checkout
Debe existir:
- carrito guest por cookie/device token
- orden guest
- enlace de orden a cuenta si luego el cliente se registra

### Inventario
No descontar stock definitivo al agregar al carrito.
Usar:
- reserva corta
- confirmación al pagar
- liberación por expiración o fallo

### Pagos
Todo webhook debe ser:
- autenticado
- idempotente
- auditado

### Background jobs
Usarlos para:
- envío de correos
- envío de SMS
- reintentos FEL
- conciliaciones
- expiración de reservas
