-- Migration 005: Add brands table and brand_id FK on products.
-- Brands are optional on products (nullable FK).

CREATE TABLE IF NOT EXISTS commerce.brands (
    id          UUID         NOT NULL DEFAULT gen_random_uuid(),
    name        VARCHAR(120) NOT NULL,
    slug        VARCHAR(140) NOT NULL,
    description VARCHAR(500) NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_brands PRIMARY KEY (id),
    CONSTRAINT uq_brands_slug UNIQUE (slug)
);

ALTER TABLE commerce.products
    ADD COLUMN IF NOT EXISTS brand_id UUID NULL,
    ADD CONSTRAINT fk_products_brand
        FOREIGN KEY (brand_id)
        REFERENCES commerce.brands(id)
        ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_products_brand_id ON commerce.products(brand_id);
