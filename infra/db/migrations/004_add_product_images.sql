-- Migration 004: Add product_images table for multi-image support per product.
-- Images are stored locally (uploads/products/) in development.
-- Designed to evolve to S3/CDN without changing the schema.

CREATE TABLE IF NOT EXISTS commerce.product_images (
    id          UUID         NOT NULL DEFAULT gen_random_uuid(),
    product_id  UUID         NOT NULL,
    image_url   VARCHAR(500) NOT NULL,
    alt_text    VARCHAR(255) NOT NULL DEFAULT '',
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_product_images PRIMARY KEY (id),
    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id)
        REFERENCES commerce.products(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_product_images_product_id
    ON commerce.product_images(product_id);
