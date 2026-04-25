-- Migration: 001_create_identity_tables
-- Description: Crea el schema 'identity' y la tabla de usuarios base.
-- Apply: psql -U tienda_online -d tienda_online -f 001_create_identity_tables.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS identity;

CREATE TABLE IF NOT EXISTS identity.users (
    id          UUID            NOT NULL DEFAULT gen_random_uuid(),
    username    VARCHAR(100)    NOT NULL,
    email       VARCHAR(200)    NOT NULL,
    password_hash VARCHAR(500)  NOT NULL,
    role        VARCHAR(50)     NOT NULL DEFAULT 'Customer',
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email    UNIQUE (email),
    CONSTRAINT chk_users_role    CHECK (role IN ('Admin', 'Staff', 'Customer'))
);

COMMENT ON TABLE  identity.users              IS 'Usuarios internos del sistema.';
COMMENT ON COLUMN identity.users.password_hash IS 'BCrypt hash de la contraseña. Nunca texto plano.';
COMMENT ON COLUMN identity.users.role          IS 'Rol del usuario: Admin | Staff | Customer.';
