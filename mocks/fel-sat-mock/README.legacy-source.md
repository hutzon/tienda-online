# FEL SAT Mock

Mock local para desarrollo y QA.

## Objetivo
Simular una parte mínima del comportamiento del flujo SAT/FEL para que el equipo pueda:
- desarrollar el módulo de facturación;
- probar integración;
- validar errores básicos;
- no bloquear el proyecto mientras se define el certificador real.

## Endpoints simulados

- `GET /test`
- `GET /getToken`
- `POST /postFactura`
- `POST /postAnulacionDTE`
- `GET /catalogos/medios-pago`
- `GET /facturas/{id}`

## Notas
- No es compatible 1:1 con SAT.
- El body puede llegar como XML o texto plano.
- El token se valida vía header `Access_Token`.
- La persistencia es en memoria para facilidad.

## Variables de entorno
- `FEL_MOCK_BASIC_USER`
- `FEL_MOCK_BASIC_PASSWORD`

## Uso
```bash
dotnet run
```

## Flujo
1. Consumir `GET /getToken` con Basic Auth.
2. Usar el token en `Access_Token`.
3. Enviar factura a `POST /postFactura`.
4. Obtener acuse simulado.
