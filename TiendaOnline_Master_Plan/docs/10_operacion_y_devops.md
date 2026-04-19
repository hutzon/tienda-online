# 10. Operación y DevOps

## Ambientes
- local
- dev
- qa
- staging
- production

## Recomendaciones
- CI con pruebas y lint
- build por app
- migraciones controladas
- secretos por vault
- logs centralizados
- health checks
- tracing distribuido
- backups PostgreSQL
- restore tests
- monitoreo de colas y webhooks

## Observabilidad
- request id / correlation id
- logs estructurados
- métricas
- dashboards
- alertas por error rate
- alertas por pagos fallidos
- alertas por facturas rechazadas
- alertas por stock inconsistente

## Despliegue
- blue/green o rolling según infraestructura
- feature flags para cambios sensibles
- rollback documentado

## Integridad operativa
- jobs idempotentes
- reintentos con backoff
- DLQ o tabla de fallos para eventos críticos
