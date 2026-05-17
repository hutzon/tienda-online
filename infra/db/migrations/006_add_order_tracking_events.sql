-- Migration 006: Add order_tracking_events table for order lifecycle history.
-- Each event records a status change with optional comment and who made the change.

CREATE TABLE IF NOT EXISTS commerce.order_tracking_events (
    id          UUID         NOT NULL DEFAULT gen_random_uuid(),
    order_id    UUID         NOT NULL,
    status      VARCHAR(30)  NOT NULL,
    comment     TEXT         NULL,
    created_by  VARCHAR(200) NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_order_tracking_events PRIMARY KEY (id),
    CONSTRAINT fk_order_tracking_events_order
        FOREIGN KEY (order_id)
        REFERENCES commerce.orders(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_order_tracking_events_order_id
    ON commerce.order_tracking_events(order_id);
