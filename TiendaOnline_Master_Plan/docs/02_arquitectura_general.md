# 02. Arquitectura general

## Visión de alto nivel

```text
Cliente Web (Next.js)
Cliente Mobile (Expo/React Native)
Admin Web (Next.js)
        |
        v
API Gateway / BFF opcional
        |
        v
ASP.NET Core Web API
        |
        +--> PostgreSQL
        +--> Redis
        +--> Object Storage
        +--> Payment Gateway
        +--> SMS/Email Provider
        +--> FEL Adapter
                   |
                   +--> Mock SAT local (desarrollo)
                   +--> Certificador autorizado (producción)
```

## Arquitectura recomendada

### Web pública
Responsable de:
- catálogo
- búsqueda
- carrito
- checkout
- cuenta del cliente
- seguimiento de pedidos
- páginas SEO
- políticas, ayuda, FAQ, contenido comercial

### Mobile app
Responsable de:
- login
- catálogo
- carrito
- checkout
- tracking
- historial
- perfil
- notificaciones push
- favoritos
- soporte al cliente

### Admin app
Responsable de:
- productos
- categorías
- precios
- cupones
- órdenes
- devoluciones
- inventario
- clientes
- facturación
- reportes
- permisos y auditoría

### Backend
Responsable de:
- reglas de negocio
- seguridad
- integraciones
- consistencia
- eventos
- auditoría
- persistencia

## Estilo interno del backend

### Recomendación
- Modular Monolith al inicio
- Event-driven interno con Outbox
- Separar por bounded contexts
- Extraer microservicios solo cuando el dolor sea real

## Patrones recomendados

- Clean Architecture pragmática
- CQRS ligero donde aporte valor
- Outbox pattern para eventos confiables
- Idempotency keys en pagos
- Soft delete solo donde tenga sentido
- Auditoría fuerte en módulos críticos
- Feature flags para cambios riesgosos

## Multitienda
Si en el futuro quieres varias marcas:
- preparar tenant_id
- separar branding, catálogo y configuración por tenant
- no complicar el MVP con multitenancy completo si hoy no lo necesitas
