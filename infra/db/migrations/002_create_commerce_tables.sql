-- Migration: 002_create_commerce_tables
-- Description: Crea schemas y tablas base de catalogo, inventario y pedidos.
-- Apply: psql -U tienda_online -d tienda_online -f 002_create_commerce_tables.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS commerce;

CREATE TABLE IF NOT EXISTS commerce.categories (
    id          UUID            NOT NULL DEFAULT gen_random_uuid(),
    name        VARCHAR(120)    NOT NULL,
    slug        VARCHAR(140)    NOT NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT pk_categories PRIMARY KEY (id),
    CONSTRAINT uq_categories_slug UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS commerce.products (
    id            UUID             NOT NULL DEFAULT gen_random_uuid(),
    category_id   UUID             NOT NULL,
    name          VARCHAR(180)     NOT NULL,
    slug          VARCHAR(180)     NOT NULL,
    sku           VARCHAR(100)     NOT NULL,
    summary       VARCHAR(320)     NOT NULL,
    description   VARCHAR(4000)    NOT NULL,
    price         NUMERIC(18, 2)   NOT NULL,
    currency      VARCHAR(3)       NOT NULL DEFAULT 'GTQ',
    is_published  BOOLEAN          NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ      NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ      NOT NULL DEFAULT now(),

    CONSTRAINT pk_products PRIMARY KEY (id),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id)
        REFERENCES commerce.categories (id) ON DELETE RESTRICT,
    CONSTRAINT uq_products_slug UNIQUE (slug),
    CONSTRAINT uq_products_sku UNIQUE (sku),
    CONSTRAINT chk_products_price_positive CHECK (price > 0)
);

CREATE TABLE IF NOT EXISTS commerce.inventory_items (
    product_id     UUID           NOT NULL,
    stock_on_hand  INTEGER        NOT NULL DEFAULT 0,
    updated_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT pk_inventory_items PRIMARY KEY (product_id),
    CONSTRAINT fk_inventory_items_product FOREIGN KEY (product_id)
        REFERENCES commerce.products (id) ON DELETE CASCADE,
    CONSTRAINT chk_inventory_non_negative CHECK (stock_on_hand >= 0)
);

CREATE TABLE IF NOT EXISTS commerce.orders (
    id              UUID             NOT NULL DEFAULT gen_random_uuid(),
    order_number    VARCHAR(40)      NOT NULL,
    status          VARCHAR(30)      NOT NULL DEFAULT 'Draft',
    customer_name   VARCHAR(180)     NOT NULL,
    customer_email  VARCHAR(200)     NOT NULL,
    currency        VARCHAR(3)       NOT NULL DEFAULT 'GTQ',
    subtotal        NUMERIC(18, 2)   NOT NULL,
    total           NUMERIC(18, 2)   NOT NULL,
    notes           VARCHAR(1000)    NULL,
    created_at      TIMESTAMPTZ      NOT NULL DEFAULT now(),

    CONSTRAINT pk_orders PRIMARY KEY (id),
    CONSTRAINT uq_orders_order_number UNIQUE (order_number),
    CONSTRAINT chk_orders_status CHECK (status IN ('Draft', 'Pending'))
);

CREATE TABLE IF NOT EXISTS commerce.order_items (
    id             UUID             NOT NULL DEFAULT gen_random_uuid(),
    order_id       UUID             NOT NULL,
    product_id     UUID             NOT NULL,
    product_name   VARCHAR(180)     NOT NULL,
    product_slug   VARCHAR(180)     NOT NULL,
    sku            VARCHAR(100)     NOT NULL,
    quantity       INTEGER          NOT NULL,
    unit_price     NUMERIC(18, 2)   NOT NULL,
    line_total     NUMERIC(18, 2)   NOT NULL,

    CONSTRAINT pk_order_items PRIMARY KEY (id),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
        REFERENCES commerce.orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id)
        REFERENCES commerce.products (id) ON DELETE RESTRICT,
    CONSTRAINT chk_order_items_quantity_positive CHECK (quantity > 0)
);

COMMENT ON TABLE commerce.categories IS 'Categorias simples del catalogo.';
COMMENT ON TABLE commerce.products IS 'Productos base del e-commerce sin variantes aun.';
COMMENT ON TABLE commerce.inventory_items IS 'Stock por producto. Simplificacion intencional de fase inicial.';
COMMENT ON TABLE commerce.orders IS 'Pedidos base sin pagos ni checkout final.';
COMMENT ON TABLE commerce.order_items IS 'Lineas de pedido con snapshot minimo del producto.';
