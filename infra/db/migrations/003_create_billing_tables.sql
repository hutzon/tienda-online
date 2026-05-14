-- Migration: 003_create_billing_tables
-- Description: Crea tablas de facturacion electronica (FEL/SAT mock).
-- Columnas en snake_case para coincidir con UseSnakeCaseNamingConvention de EF Core.

SET search_path TO commerce;

CREATE TABLE IF NOT EXISTS invoices (
    id                UUID             NOT NULL DEFAULT gen_random_uuid(),
    order_id          UUID             NOT NULL,
    uuid              VARCHAR(100)     NULL,
    sat_signature     VARCHAR(255)     NULL,
    status            VARCHAR(30)      NOT NULL,
    subtotal          NUMERIC(18, 2)   NOT NULL,
    tax_amount        NUMERIC(18, 2)   NOT NULL,
    total             NUMERIC(18, 2)   NOT NULL,
    payload_sent      TEXT             NULL,
    provider_response TEXT             NULL,
    created_at        TIMESTAMPTZ      NOT NULL DEFAULT now(),
    emitted_at        TIMESTAMPTZ      NULL,

    CONSTRAINT pk_invoices PRIMARY KEY (id),
    CONSTRAINT fk_invoices_orders_order_id FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS invoice_lines (
    id           UUID             NOT NULL DEFAULT gen_random_uuid(),
    invoice_id   UUID             NOT NULL,
    product_id   UUID             NOT NULL,
    product_name VARCHAR(180)     NOT NULL,
    sku          VARCHAR(100)     NOT NULL,
    quantity     INTEGER          NOT NULL,
    unit_price   NUMERIC(18, 2)   NOT NULL,
    line_total   NUMERIC(18, 2)   NOT NULL,

    CONSTRAINT pk_invoice_lines PRIMARY KEY (id),
    CONSTRAINT fk_invoice_lines_invoices_invoice_id FOREIGN KEY (invoice_id)
        REFERENCES invoices (id) ON DELETE CASCADE
);

CREATE INDEX ix_invoices_order_id ON invoices (order_id);
CREATE INDEX ix_invoice_lines_invoice_id ON invoice_lines (invoice_id);
