# 09. Estructura sugerida del repositorio

```text
tiendaonline/
  apps/
    web-store/
    web-admin/
    mobile-app/
    api/
  packages/
    ui/
    config/
    types/
    api-client/
    validation/
    analytics/
  infra/
    docker/
    nginx/
    db/
    observability/
  docs/
  agents/
  mocks/
    fel-sat-mock/
```

## Reglas
- `apps/api` contiene el backend principal.
- `packages/types` comparte contratos generados.
- `packages/validation` concentra esquemas compartibles.
- `docs` contiene arquitectura, decisiones y manuales.
- `agents` contiene memoria viva del proyecto e handoffs.
- `mocks` contiene simuladores locales.

## Convenciones
- ADRs simples para decisiones importantes.
- Un archivo de memoria vivo.
- Un handoff por tarea o bloque de trabajo.
