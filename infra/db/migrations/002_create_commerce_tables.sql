-- Migration: 002_create_commerce_tables
-- Description: Crea schemas y tablas base de catalogo, inventario, pedidos, checkout y pagos.
-- Columnas en snake_case para coincidir con UseSnakeCaseNamingConvention de EF Core.

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
    customer_name   VARCHAR(180)     NOT NULL DEFAULT '',
    customer_email  VARCHAR(200)     NOT NULL DEFAULT '',
    phone           VARCHAR(50)      NOT NULL DEFAULT '',
    address         VARCHAR(1000)    NOT NULL DEFAULT '',
    currency        VARCHAR(3)       NOT NULL DEFAULT 'GTQ',
    subtotal        NUMERIC(18, 2)   NOT NULL DEFAULT 0,
    total           NUMERIC(18, 2)   NOT NULL DEFAULT 0,
    notes           VARCHAR(1000)    NULL,
    created_at      TIMESTAMPTZ      NOT NULL DEFAULT now(),

    CONSTRAINT pk_orders PRIMARY KEY (id),
    CONSTRAINT uq_orders_order_number UNIQUE (order_number)
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

CREATE TABLE IF NOT EXISTS commerce.checkout_sessions (
    id          UUID            NOT NULL DEFAULT gen_random_uuid(),
    order_id    UUID            NOT NULL,
    status      VARCHAR(30)     NOT NULL DEFAULT 'Active',
    expires_at  TIMESTAMPTZ     NOT NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT pk_checkout_sessions PRIMARY KEY (id),
    CONSTRAINT fk_checkout_sessions_order FOREIGN KEY (order_id)
        REFERENCES commerce.orders (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS commerce.payment_attempts (
    id                      UUID             NOT NULL DEFAULT gen_random_uuid(),
    order_id                UUID             NOT NULL,
    amount                  NUMERIC(18, 2)   NOT NULL,
    currency                VARCHAR(3)       NOT NULL DEFAULT 'GTQ',
    payment_method          VARCHAR(50)      NOT NULL,
    status                  VARCHAR(30)      NOT NULL DEFAULT 'Pending',
    provider_transaction_id VARCHAR(200)     NULL,
    created_at              TIMESTAMPTZ      NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ      NOT NULL DEFAULT now(),

    CONSTRAINT pk_payment_attempts PRIMARY KEY (id),
    CONSTRAINT fk_payment_attempts_order FOREIGN KEY (order_id)
        REFERENCES commerce.orders (id) ON DELETE CASCADE
);

CREATE INDEX ix_products_category_id ON commerce.products (category_id);
CREATE INDEX ix_order_items_order_id ON commerce.order_items (order_id);
CREATE INDEX ix_order_items_product_id ON commerce.order_items (product_id);
CREATE INDEX ix_checkout_sessions_order_id ON commerce.checkout_sessions (order_id);
CREATE INDEX ix_payment_attempts_order_id ON commerce.payment_attempts (order_id);

COMMENT ON TABLE commerce.categories IS 'Categorias simples del catalogo.';
COMMENT ON TABLE commerce.products IS 'Productos base del e-commerce sin variantes aun.';
COMMENT ON TABLE commerce.inventory_items IS 'Stock por producto. Simplificacion intencional de fase inicial.';
COMMENT ON TABLE commerce.orders IS 'Pedidos base del sistema.';
COMMENT ON TABLE commerce.order_items IS 'Lineas de pedido con snapshot minimo del producto.';
COMMENT ON TABLE commerce.checkout_sessions IS 'Sesiones de checkout activas.';
COMMENT ON TABLE commerce.payment_attempts IS 'Intentos de pago por pedido.';
