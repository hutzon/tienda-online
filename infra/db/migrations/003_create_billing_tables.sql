-- 003_create_billing_tables.sql
-- Creado: 2026-04-25

SET search_path TO commerce;

CREATE TABLE invoices (
    "Id" uuid NOT NULL,
    "OrderId" uuid NOT NULL,
    "Uuid" character varying(100),
    "SatSignature" character varying(255),
    "Status" character varying(30) NOT NULL,
    "Subtotal" numeric(18,2) NOT NULL,
    "TaxAmount" numeric(18,2) NOT NULL,
    "Total" numeric(18,2) NOT NULL,
    "PayloadSent" text,
    "ProviderResponse" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "EmittedAt" timestamp with time zone,
    CONSTRAINT "PK_invoices" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_invoices_orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES orders ("Id") ON DELETE RESTRICT
);

CREATE TABLE invoice_lines (
    "Id" uuid NOT NULL,
    "InvoiceId" uuid NOT NULL,
    "ProductId" uuid NOT NULL,
    "ProductName" character varying(180) NOT NULL,
    "Sku" character varying(100) NOT NULL,
    "Quantity" integer NOT NULL,
    "UnitPrice" numeric(18,2) NOT NULL,
    "LineTotal" numeric(18,2) NOT NULL,
    CONSTRAINT "PK_invoice_lines" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_invoice_lines_invoices_InvoiceId" FOREIGN KEY ("InvoiceId") REFERENCES invoices ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_invoices_OrderId" ON invoices ("OrderId");
CREATE INDEX "IX_invoice_lines_InvoiceId" ON invoice_lines ("InvoiceId");
