# 06. Seguridad y compliance

## Principios

- zero trust razonable
- mínimo privilegio
- secretos fuera del código
- separación de ambientes
- auditoría
- cifrado en tránsito
- cifrado en reposo donde aplique
- validación server-side siempre

## Seguridad de autenticación

### Cliente
- login por email o teléfono
- verificación obligatoria de al menos un canal
- rate limit por IP y por cuenta
- device/session management
- refresh tokens rotados
- invalidación al cambiar contraseña

### Admin
- MFA obligatorio
- RBAC
- acciones sensibles con auditoría
- step-up auth para cambios críticos

## Seguridad de pagos

- no almacenar PAN/CVV en tu sistema
- usar checkout hospedado o tokenización del PSP
- validar webhooks con firma
- idempotencia
- conciliación
- bitácora

## Seguridad de API

- HTTPS obligatorio
- JWT de corta vida
- refresh tokens seguros
- scopes / permisos
- validación de entrada
- protección contra replay
- logging sin exponer secretos
- rate limiting
- WAF/CDN si el tráfico crece

## Seguridad de datos

Clasificar:
- P0: secretos y llaves
- P1: pagos
- P2: PII
- P3: analítica

## Logs
Nunca loguear:
- contraseñas
- OTP
- tokens completos
- datos completos de tarjeta
- secretos

## Riesgos especiales
- fraude en COD
- abuso de cupones
- scraping de inventario
- bots en checkout
- reenvío malicioso de enlaces
- manipulación de precios
- manipulación de stock
- reintentos dobles de webhook
