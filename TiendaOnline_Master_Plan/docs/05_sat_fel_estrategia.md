# 05. Estrategia SAT / FEL

## Realidad técnica

La tienda **no debería acoplarse directamente a SAT como si fuera certificador**.

La arquitectura correcta es:

```text
TiendaOnline
   -> Invoicing Core
   -> IFelProvider
        -> FelMockProvider (local/dev)
        -> CertificadorRealProvider (prod)
```

## Interfaz sugerida

```text
CreateInvoice(order)
AnnulInvoice(invoiceId, reason)
GetInvoiceStatus(externalId)
DownloadInvoicePdf(invoiceId)
ResendInvoice(invoiceId, channel)
```

## Flujo recomendado

1. La orden se confirma.
2. Se crea un documento fiscal interno.
3. Se envía al provider FEL.
4. Se guarda:
   - request
   - response
   - acuse
   - UUID / autorización
   - XML / PDF si aplica
5. Se notifica por email y/o SMS.
6. Si falla:
   - se marca pendiente
   - se reintenta con backoff
   - queda visible en admin

## Mock local FEL/SAT

El mock debe simular:
- health endpoint
- emisión
- anulación
- token temporal
- acuses
- validaciones mínimas
- catálogo de medios de pago

## Qué NO hace el mock
- no reemplaza a SAT;
- no garantiza compatibilidad legal completa;
- no reemplaza certificación;
- no sustituye pruebas con certificador real.

## Reglas internas

- nunca bloquear la UI mientras FEL tarda demasiado;
- usar cola para emisión si el negocio lo permite;
- exponer estados claros:
  - pending
  - certified
  - rejected
  - annulled
  - retrying

## Email y SMS de factura

### Email
Enviar:
- resumen
- número de orden
- número de factura
- PDF o enlace
- soporte

### SMS
Usar SMS solo para:
- confirmación resumida
- aviso de factura emitida
- enlace corto seguro

No enviar datos sensibles por SMS.
