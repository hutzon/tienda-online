# Migraciones de base de datos

Migraciones SQL ordenadas por número de secuencia. Se aplican manualmente o via script.

## Cómo aplicar

```bash
psql -U tienda_online -d tienda_online -f infra/db/migrations/001_create_identity_tables.sql
```

Con Docker en ejecución:

```bash
docker exec -i tienda-online-postgres-1 psql -U tienda_online -d tienda_online \
  < infra/db/migrations/001_create_identity_tables.sql
```

## Migraciones disponibles

| # | Archivo | Descripción |
|---|---|---|
| 001 | `001_create_identity_tables.sql` | Schema `identity` y tabla `users` |

## Convención

- Prefijo numérico de tres dígitos (`001`, `002`, …).
- Cada migración debe ser idempotente (`CREATE TABLE IF NOT EXISTS`, etc.).
- No eliminar ni modificar migraciones ya aplicadas en producción.
