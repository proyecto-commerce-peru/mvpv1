-- Seed data for Primas demo (Postgres)
-- Ensure DATABASE_URL points to your Postgres instance before running:
-- pnpm prisma db execute --schema prisma/schema.prisma --file databases/seed_primas.sql

-- Tenant
INSERT INTO tenants (
  id, name, legal_name, tax_id, slug, status, country_code, timezone, currency_code, metadata, created_at, updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111', 'Primas Demo', 'Primas Demo SAC', '20123456789', 'primas-demo', 'ACTIVE', 'PE', 'America/Lima', 'PEN', '{}', NOW(), NOW()
);

-- Tenant settings
INSERT INTO tenant_settings (id, tenant_id, key, value, scope, created_at, updated_at) VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'features.whatsapp', '{"enabled":true}', 'TENANT', NOW(), NOW());

-- Store and catalog
INSERT INTO tenant_stores (id, tenant_id, name, channel, status, created_at, updated_at) VALUES
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Main Store', 'WEB', 'ACTIVE', NOW(), NOW());

INSERT INTO catalogs (id, tenant_id, store_id, name, status, created_at, updated_at) VALUES
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Default Catalog', 'ACTIVE', NOW(), NOW());

-- User and profile
INSERT INTO users (id, tenant_id, email, status, created_at, updated_at) VALUES
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'admin@primas.demo', 'ACTIVE', NOW(), NOW());

INSERT INTO user_profiles (id, tenant_id, user_id, full_name, locale, timezone, created_at, updated_at) VALUES
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Admin User', 'es-PE', 'America/Lima', NOW(), NOW());

-- Offering, variant, price list, price
INSERT INTO store_offerings (id, tenant_id, catalog_id, type, title, status, currency_code, is_tax_included, created_at, updated_at) VALUES
  ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'PRODUCT', 'Demo Product', 'ACTIVE', 'PEN', true, NOW(), NOW());

INSERT INTO store_variants (id, tenant_id, offering_id, sku, status, price_final, tax_rate, created_at, updated_at) VALUES
  ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'SKU-001', 'ACTIVE', 49.90, 0.18, NOW(), NOW());

INSERT INTO price_lists (id, tenant_id, catalog_id, name, currency_code, is_default, created_at, updated_at) VALUES
  ('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Default', 'PEN', true, NOW(), NOW());

INSERT INTO prices (id, tenant_id, price_list_id, offering_id, variant_id, list_price, sale_price, is_active, created_at, updated_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888', 49.90, 49.90, true, NOW(), NOW());

-- Customer, address, cart, order
INSERT INTO customers (id, tenant_id, full_name, phone_e164, email, status, created_at, updated_at) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'John Doe', '+51999999999', 'john.doe@example.com', 'ACTIVE', NOW(), NOW());

INSERT INTO customer_addresses (id, tenant_id, customer_id, label, country_code, address_line1, is_default, created_at, updated_at) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Home', 'PE', '123 Main St', true, NOW(), NOW());

INSERT INTO carts (id, tenant_id, customer_id, status, currency_code, created_at, updated_at) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ACTIVE', 'PEN', NOW(), NOW());

INSERT INTO cart_items (id, tenant_id, cart_id, offering_id, variant_id, quantity, unit_price, meta, created_at) VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888', 1, 49.90, '{}', NOW());

INSERT INTO orders (
  id, tenant_id, customer_id, order_number, status, channel, currency_code, subtotal, discount_total, tax_total, shipping_total, total, coupon_id, notes, shipping_address_id, billing_address_id, placed_at, created_by_user_id, metadata, created_at, updated_at
) VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ORD-1001', 'PAID', 'WHATSAPP', 'PEN', 49.90, 0, 7.48, 0, 49.90, NULL, NULL, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW(), '55555555-5555-5555-5555-555555555555', '{}', NOW(), NOW()
);

INSERT INTO order_items (id, tenant_id, order_id, offering_id, variant_id, type, title_snapshot, sku_snapshot, unit_price, quantity, total_price, tax_amount, discount_amount, meta, created_at) VALUES
  ('12121212-1212-1212-1212-121212121212', '11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888', 'PRODUCT', 'Demo Product', 'SKU-001', 49.90, 1, 49.90, 7.48, 0, '{}', NOW());
