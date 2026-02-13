CREATE TABLE "tenants" (
  "id" uuid PRIMARY KEY,
  "name" varchar(160) NOT NULL,
  "legal_name" varchar(200),
  "tax_id" varchar(32),
  "slug" varchar(160) UNIQUE NOT NULL,
  "status" varchar(24) NOT NULL DEFAULT 'ACTIVE',
  "country_code" char(2) NOT NULL DEFAULT 'PE',
  "timezone" varchar(64) NOT NULL DEFAULT 'America/Lima',
  "currency_code" char(3) NOT NULL DEFAULT 'PEN',
  "metadata" json,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "deleted_at" timestamptz
);

CREATE TABLE "tenant_settings" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "key" varchar(120) NOT NULL,
  "value" json NOT NULL,
  "scope" varchar(24) NOT NULL DEFAULT 'TENANT',
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "tenant_stores" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "name" varchar(160) NOT NULL,
  "channel" varchar(24) NOT NULL DEFAULT 'WEB',
  "status" varchar(24) NOT NULL DEFAULT 'ACTIVE',
  "address_text" varchar(300),
  "metadata" json,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "deleted_at" timestamptz
);

CREATE TABLE "tenant_domains" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "domain" varchar(255) NOT NULL,
  "is_primary" boolean NOT NULL DEFAULT false,
  "is_verified" boolean NOT NULL DEFAULT false,
  "verified_at" timestamptz,
  "created_at" timestamptz NOT NULL
);

CREATE TABLE "saas_subscriptions" (
  "id" uuid PRIMARY KEY,
  "code" varchar(40) UNIQUE NOT NULL,
  "name" varchar(120) NOT NULL,
  "description" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "membership_conditions" (
  "id" uuid PRIMARY KEY,
  "saas_subscription_id" uuid NOT NULL,
  "key" varchar(120) NOT NULL,
  "value" json NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "tenant_saas_subscriptions" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "saas_subscription_id" uuid NOT NULL,
  "status" varchar(24) NOT NULL DEFAULT 'ACTIVE',
  "started_at" timestamptz NOT NULL,
  "ends_at" timestamptz,
  "trial_ends_at" timestamptz,
  "cancel_at_period_end" boolean NOT NULL DEFAULT false,
  "metadata" json,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "saas_invoices" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "tenant_saas_subscription_id" uuid,
  "invoice_number" varchar(64) NOT NULL,
  "currency_code" char(3) NOT NULL DEFAULT 'PEN',
  "amount_total" numeric NOT NULL,
  "amount_paid" numeric NOT NULL DEFAULT 0,
  "status" varchar(24) NOT NULL DEFAULT 'OPEN',
  "due_date" timestamptz,
  "paid_at" timestamptz,
  "provider" varchar(40),
  "provider_invoice_id" varchar(140),
  "metadata" json,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "email" varchar(255) NOT NULL,
  "status" varchar(24) NOT NULL DEFAULT 'ACTIVE',
  "email_verified_at" timestamptz,
  "invited_by_user_id" uuid,
  "invited_at" timestamptz,
  "last_login_at" timestamptz,
  "metadata" json,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "deleted_at" timestamptz
);

CREATE TABLE "user_profiles" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "full_name" varchar(180) NOT NULL,
  "phone" varchar(32),
  "avatar_url" text,
  "locale" varchar(16) NOT NULL DEFAULT 'es-PE',
  "timezone" varchar(64) NOT NULL DEFAULT 'America/Lima',
  "metadata" json,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "auth_identities" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "provider" varchar(24) NOT NULL,
  "provider_user_id" varchar(140),
  "password_hash" varchar(255),
  "password_updated_at" timestamptz,
  "mfa_enabled" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "password_reset_tokens" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "token_hash" varchar(255) NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz,
  "created_at" timestamptz NOT NULL
);

CREATE TABLE "roles" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "name" varchar(80) NOT NULL,
  "description" text,
  "is_system" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "permissions" (
  "id" uuid PRIMARY KEY,
  "key" varchar(140) UNIQUE NOT NULL,
  "description" text
);

CREATE TABLE "role_permissions" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "role_id" uuid NOT NULL,
  "permission_id" uuid NOT NULL
);

CREATE TABLE "user_roles" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL
);

CREATE TABLE "customers" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "full_name" varchar(180),
  "phone_e164" varchar(32) NOT NULL,
  "email" varchar(255),
  "status" varchar(24) NOT NULL DEFAULT 'ACTIVE',
  "marketing_opt_in" boolean NOT NULL DEFAULT false,
  "metadata" json,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "deleted_at" timestamptz
);

CREATE TABLE "tags" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "name" varchar(80) NOT NULL
);

CREATE TABLE "customer_tags" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "tag_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL
);

CREATE TABLE "customer_addresses" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "label" varchar(60),
  "country_code" char(2) NOT NULL DEFAULT 'PE',
  "region" varchar(80),
  "city" varchar(80),
  "district" varchar(80),
  "address_line1" varchar(160) NOT NULL,
  "address_line2" varchar(160),
  "reference" varchar(200),
  "postal_code" varchar(20),
  "geo_lat" numeric,
  "geo_lng" numeric,
  "is_default" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "catalogs" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "store_id" uuid NOT NULL,
  "name" varchar(120) NOT NULL DEFAULT 'Default Catalog',
  "status" varchar(24) NOT NULL DEFAULT 'ACTIVE',
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "categories" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "catalog_id" uuid NOT NULL,
  "parent_id" uuid,
  "name" varchar(140) NOT NULL,
  "slug" varchar(160) NOT NULL,
  "sort_order" int NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "store_offerings" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "catalog_id" uuid NOT NULL,
  "type" varchar(24) NOT NULL,
  "title" varchar(180) NOT NULL,
  "description" text,
  "status" varchar(24) NOT NULL DEFAULT 'ACTIVE',
  "handle" varchar(180),
  "cover_image_url" text,
  "currency_code" char(3) NOT NULL DEFAULT 'PEN',
  "tax_code" varchar(40),
  "is_tax_included" boolean NOT NULL DEFAULT true,
  "base_data" json,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "deleted_at" timestamptz
);

CREATE TABLE "store_offering_categories" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "offering_id" uuid NOT NULL,
  "category_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL
);

CREATE TABLE "store_offering_images" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "offering_id" uuid NOT NULL,
  "url" text NOT NULL,
  "alt_text" varchar(160),
  "sort_order" int NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL
);

CREATE TABLE "store_offering_attributes" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "offering_id" uuid NOT NULL,
  "key" varchar(120) NOT NULL,
  "value" text NOT NULL,
  "created_at" timestamptz NOT NULL
);

CREATE TABLE "option_types" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "offering_id" uuid NOT NULL,
  "name" varchar(80) NOT NULL,
  "sort_order" int NOT NULL DEFAULT 0
);

CREATE TABLE "option_values" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "option_type_id" uuid NOT NULL,
  "value" varchar(80) NOT NULL,
  "sort_order" int NOT NULL DEFAULT 0
);

CREATE TABLE "store_variants" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "offering_id" uuid NOT NULL,
  "sku" varchar(80),
  "barcode" varchar(80),
  "status" varchar(24) NOT NULL DEFAULT 'ACTIVE',
  "price_final" numeric NOT NULL DEFAULT 0,
  "tax_rate" numeric NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "deleted_at" timestamptz
);

CREATE TABLE "store_variant_options" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "variant_id" uuid NOT NULL,
  "option_value_id" uuid NOT NULL
);

CREATE TABLE "product_details" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "offering_id" uuid NOT NULL,
  "unit" varchar(40),
  "weight_kg" numeric,
  "requires_shipping" boolean NOT NULL DEFAULT true,
  "allow_backorder" boolean NOT NULL DEFAULT false,
  "shipping_data" json,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "service_details" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "offering_id" uuid NOT NULL,
  "duration_minutes" int NOT NULL DEFAULT 60,
  "location_type" varchar(32) NOT NULL,
  "requires_schedule" boolean NOT NULL DEFAULT true,
  "buffer_before_min" int NOT NULL DEFAULT 0,
  "buffer_after_min" int NOT NULL DEFAULT 0,
  "booking_rules" json,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "membership_plans" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "offering_id" uuid NOT NULL,
  "billing_type" varchar(24) NOT NULL,
  "period_unit" varchar(16),
  "period_count" int,
  "validity_days" int,
  "credits_included" int,
  "rollover_credits" boolean NOT NULL DEFAULT false,
  "trial_days" int NOT NULL DEFAULT 0,
  "entitlements" json,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "price_lists" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "catalog_id" uuid NOT NULL,
  "name" varchar(120) NOT NULL,
  "currency_code" char(3) NOT NULL DEFAULT 'PEN',
  "is_default" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "prices" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "price_list_id" uuid NOT NULL,
  "offering_id" uuid,
  "variant_id" uuid,
  "list_price" numeric,
  "sale_price" numeric NOT NULL,
  "starts_at" timestamptz,
  "ends_at" timestamptz,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "inventory_locations" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "store_id" uuid,
  "name" varchar(120) NOT NULL,
  "code" varchar(40),
  "is_default" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "stock_items" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "offering_id" uuid,
  "variant_id" uuid,
  "track_stock" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL
);

CREATE TABLE "stock_balances" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "stock_item_id" uuid NOT NULL,
  "location_id" uuid NOT NULL,
  "qty_on_hand" int NOT NULL DEFAULT 0,
  "qty_reserved" int NOT NULL DEFAULT 0,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "stock_movements" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "stock_item_id" uuid NOT NULL,
  "location_id" uuid NOT NULL,
  "movement_type" varchar(24) NOT NULL,
  "qty" int NOT NULL,
  "reason" varchar(200),
  "reference_type" varchar(40),
  "reference_id" uuid,
  "created_by_user_id" uuid,
  "created_at" timestamptz NOT NULL
);

CREATE TABLE "carts" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "status" varchar(24) NOT NULL DEFAULT 'ACTIVE',
  "currency_code" char(3) NOT NULL DEFAULT 'PEN',
  "price_list_id" uuid,
  "source" varchar(24) NOT NULL DEFAULT 'WHATSAPP',
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "cart_items" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "cart_id" uuid NOT NULL,
  "offering_id" uuid NOT NULL,
  "variant_id" uuid,
  "quantity" int NOT NULL DEFAULT 1,
  "unit_price" numeric NOT NULL,
  "meta" json,
  "created_at" timestamptz NOT NULL
);

CREATE TABLE "orders" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "order_number" varchar(40) NOT NULL,
  "status" varchar(32) NOT NULL DEFAULT 'PENDING_PAYMENT',
  "channel" varchar(24) NOT NULL DEFAULT 'WHATSAPP',
  "currency_code" char(3) NOT NULL DEFAULT 'PEN',
  "price_list_id" uuid,
  "subtotal" numeric NOT NULL DEFAULT 0,
  "discount_total" numeric NOT NULL DEFAULT 0,
  "tax_total" numeric NOT NULL DEFAULT 0,
  "shipping_total" numeric NOT NULL DEFAULT 0,
  "total" numeric NOT NULL DEFAULT 0,
  "coupon_id" uuid,
  "notes" text,
  "shipping_address_id" uuid,
  "billing_address_id" uuid,
  "placed_at" timestamptz,
  "created_by_user_id" uuid,
  "metadata" json,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "order_items" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "offering_id" uuid NOT NULL,
  "variant_id" uuid,
  "type" varchar(24) NOT NULL,
  "title_snapshot" varchar(200) NOT NULL,
  "sku_snapshot" varchar(80),
  "unit_price" numeric NOT NULL,
  "quantity" int NOT NULL DEFAULT 1,
  "total_price" numeric NOT NULL,
  "tax_amount" numeric NOT NULL DEFAULT 0,
  "discount_amount" numeric NOT NULL DEFAULT 0,
  "meta" json,
  "created_at" timestamptz NOT NULL
);

CREATE TABLE "fulfillments" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "status" varchar(24) NOT NULL DEFAULT 'PENDING',
  "carrier" varchar(80),
  "tracking_code" varchar(120),
  "shipped_at" timestamptz,
  "delivered_at" timestamptz,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "service_bookings" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "offering_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "order_id" uuid,
  "status" varchar(24) NOT NULL DEFAULT 'PENDING',
  "starts_at" timestamptz NOT NULL,
  "ends_at" timestamptz NOT NULL,
  "assigned_user_id" uuid,
  "notes" text,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "customer_memberships" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "membership_plan_id" uuid NOT NULL,
  "order_id" uuid,
  "status" varchar(24) NOT NULL DEFAULT 'ACTIVE',
  "started_at" timestamptz NOT NULL,
  "current_period_start" timestamptz,
  "current_period_end" timestamptz,
  "expires_at" timestamptz,
  "credits_balance" int NOT NULL DEFAULT 0,
  "auto_renew" boolean NOT NULL DEFAULT false,
  "metadata" json,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "coupons" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "code" varchar(40) NOT NULL,
  "status" varchar(24) NOT NULL DEFAULT 'ACTIVE',
  "discount_type" varchar(16) NOT NULL,
  "discount_value" numeric NOT NULL,
  "min_order_total" numeric,
  "max_uses" int,
  "used_count" int NOT NULL DEFAULT 0,
  "starts_at" timestamptz,
  "ends_at" timestamptz,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "coupon_rules" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "coupon_id" uuid NOT NULL,
  "scope" varchar(24) NOT NULL,
  "offering_id" uuid,
  "category_id" uuid,
  "rule_type" varchar(16) NOT NULL,
  "rule" json
);

CREATE TABLE "payment_methods" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "provider" varchar(40) NOT NULL,
  "name" varchar(120) NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "config" json,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "payments" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "method_id" uuid NOT NULL,
  "status" varchar(24) NOT NULL DEFAULT 'PENDING',
  "amount" numeric NOT NULL,
  "currency_code" char(3) NOT NULL DEFAULT 'PEN',
  "provider_payment_id" varchar(140),
  "idempotency_key" varchar(140) NOT NULL,
  "provider_payload" json,
  "paid_at" timestamptz,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "refunds" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "payment_id" uuid NOT NULL,
  "status" varchar(24) NOT NULL DEFAULT 'PENDING',
  "amount" numeric NOT NULL,
  "reason" varchar(200),
  "provider_refund_id" varchar(140),
  "requested_by_user_id" uuid,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "tax_documents" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "doc_type" varchar(16) NOT NULL,
  "series" varchar(8),
  "number" varchar(16),
  "status" varchar(24) NOT NULL DEFAULT 'PENDING',
  "customer_doc_type" varchar(16),
  "customer_doc_number" varchar(32),
  "sunat_payload" json,
  "sunat_response" json,
  "issued_at" timestamptz,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "whatsapp_accounts" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "store_id" uuid,
  "provider" varchar(40) NOT NULL,
  "phone_number_id" varchar(120) NOT NULL,
  "waba_id" varchar(120),
  "display_phone" varchar(32),
  "is_active" boolean NOT NULL DEFAULT true,
  "config" json,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "whatsapp_conversations" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "whatsapp_account_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "wa_conversation_id" varchar(140),
  "status" varchar(16) NOT NULL DEFAULT 'OPEN',
  "last_message_at" timestamptz,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "whatsapp_messages" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "conversation_id" uuid NOT NULL,
  "direction" varchar(16) NOT NULL,
  "message_type" varchar(32) NOT NULL,
  "provider_message_id" varchar(160),
  "text_body" text,
  "payload" json,
  "status" varchar(16) NOT NULL DEFAULT 'SENT',
  "sent_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL
);

CREATE TABLE "whatsapp_templates" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "name" varchar(120) NOT NULL,
  "language" varchar(16) NOT NULL DEFAULT 'es',
  "category" varchar(24) NOT NULL,
  "content" json NOT NULL,
  "status" varchar(16) NOT NULL DEFAULT 'ACTIVE',
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "conversation_orders" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "conversation_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL
);

CREATE TABLE "webhook_events" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "provider" varchar(40) NOT NULL,
  "event_type" varchar(160) NOT NULL,
  "external_id" varchar(160) NOT NULL,
  "payload" json NOT NULL,
  "received_at" timestamptz NOT NULL,
  "processed_at" timestamptz,
  "status" varchar(24) NOT NULL DEFAULT 'RECEIVED',
  "error" text
);

CREATE TABLE "outbox_events" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "topic" varchar(180) NOT NULL,
  "payload" json NOT NULL,
  "status" varchar(16) NOT NULL DEFAULT 'PENDING',
  "available_at" timestamptz NOT NULL,
  "sent_at" timestamptz,
  "attempts" int NOT NULL DEFAULT 0,
  "last_error" text,
  "created_at" timestamptz NOT NULL
);

CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "actor_user_id" uuid,
  "action" varchar(180) NOT NULL,
  "entity_type" varchar(80) NOT NULL,
  "entity_id" uuid,
  "before" json,
  "after" json,
  "ip" varchar(48),
  "user_agent" varchar(200),
  "created_at" timestamptz NOT NULL
);

CREATE TABLE "prospects" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "store_id" uuid,
  "full_name" varchar(180),
  "phone_e164" varchar(32),
  "email" varchar(255),
  "source" varchar(24) NOT NULL DEFAULT 'WHATSAPP',
  "stage" varchar(24) NOT NULL DEFAULT 'NEW',
  "notes" text,
  "metadata" json,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "reports" (
  "id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "store_id" uuid,
  "period" varchar(16) NOT NULL,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "metrics" json NOT NULL,
  "created_at" timestamptz NOT NULL
);

CREATE INDEX ON "tenants" ("status");

CREATE INDEX ON "tenants" ("country_code");

CREATE INDEX ON "tenants" ("created_at");

CREATE UNIQUE INDEX ON "tenant_settings" ("tenant_id", "key");

CREATE INDEX ON "tenant_settings" ("tenant_id", "scope", "key");

CREATE INDEX ON "tenant_stores" ("tenant_id", "name");

CREATE INDEX ON "tenant_stores" ("tenant_id", "status");

CREATE UNIQUE INDEX ON "tenant_domains" ("domain");

CREATE UNIQUE INDEX ON "tenant_domains" ("tenant_id", "domain");

CREATE INDEX ON "tenant_domains" ("tenant_id", "is_primary");

CREATE UNIQUE INDEX ON "membership_conditions" ("saas_subscription_id", "key");

CREATE UNIQUE INDEX ON "tenant_saas_subscriptions" ("tenant_id");

CREATE INDEX ON "tenant_saas_subscriptions" ("saas_subscription_id");

CREATE INDEX ON "tenant_saas_subscriptions" ("status");

CREATE UNIQUE INDEX ON "saas_invoices" ("tenant_id", "invoice_number");

CREATE INDEX ON "saas_invoices" ("tenant_id", "status");

CREATE INDEX ON "saas_invoices" ("provider", "provider_invoice_id");

CREATE UNIQUE INDEX ON "users" ("tenant_id", "email");

CREATE INDEX ON "users" ("tenant_id", "status");

CREATE UNIQUE INDEX ON "user_profiles" ("tenant_id", "user_id");

CREATE UNIQUE INDEX ON "auth_identities" ("tenant_id", "user_id", "provider");

CREATE INDEX ON "auth_identities" ("tenant_id", "provider", "provider_user_id");

CREATE INDEX ON "password_reset_tokens" ("tenant_id", "user_id");

CREATE UNIQUE INDEX ON "password_reset_tokens" ("token_hash");

CREATE INDEX ON "password_reset_tokens" ("expires_at");

CREATE UNIQUE INDEX ON "roles" ("tenant_id", "name");

CREATE UNIQUE INDEX ON "role_permissions" ("tenant_id", "role_id", "permission_id");

CREATE UNIQUE INDEX ON "user_roles" ("tenant_id", "user_id", "role_id");

CREATE UNIQUE INDEX ON "customers" ("tenant_id", "phone_e164");

CREATE INDEX ON "customers" ("tenant_id", "email");

CREATE INDEX ON "customers" ("tenant_id", "status");

CREATE UNIQUE INDEX ON "tags" ("tenant_id", "name");

CREATE UNIQUE INDEX ON "customer_tags" ("tenant_id", "customer_id", "tag_id");

CREATE INDEX ON "customer_addresses" ("tenant_id", "customer_id");

CREATE UNIQUE INDEX ON "catalogs" ("store_id");

CREATE INDEX ON "catalogs" ("tenant_id", "store_id");

CREATE UNIQUE INDEX ON "categories" ("catalog_id", "slug");

CREATE INDEX ON "categories" ("catalog_id", "parent_id");

CREATE INDEX ON "store_offerings" ("tenant_id", "type");

CREATE INDEX ON "store_offerings" ("tenant_id", "handle");

CREATE INDEX ON "store_offerings" ("catalog_id", "status");

CREATE UNIQUE INDEX ON "store_offering_categories" ("tenant_id", "offering_id", "category_id");

CREATE INDEX ON "store_offering_images" ("tenant_id", "offering_id", "sort_order");

CREATE INDEX ON "store_offering_attributes" ("tenant_id", "offering_id", "key");

CREATE UNIQUE INDEX ON "option_types" ("tenant_id", "offering_id", "name");

CREATE UNIQUE INDEX ON "option_values" ("tenant_id", "option_type_id", "value");

CREATE INDEX ON "store_variants" ("tenant_id", "offering_id");

CREATE INDEX ON "store_variants" ("tenant_id", "sku");

CREATE UNIQUE INDEX ON "store_variant_options" ("tenant_id", "variant_id", "option_value_id");

CREATE UNIQUE INDEX ON "product_details" ("tenant_id", "offering_id");

CREATE UNIQUE INDEX ON "service_details" ("tenant_id", "offering_id");

CREATE UNIQUE INDEX ON "membership_plans" ("tenant_id", "offering_id");

CREATE UNIQUE INDEX ON "price_lists" ("tenant_id", "catalog_id", "name");

CREATE INDEX ON "price_lists" ("tenant_id", "catalog_id", "is_default");

CREATE UNIQUE INDEX ON "prices" ("tenant_id", "price_list_id", "offering_id", "variant_id");

CREATE INDEX ON "prices" ("tenant_id", "is_active", "starts_at", "ends_at");

CREATE UNIQUE INDEX ON "inventory_locations" ("tenant_id", "name");

CREATE INDEX ON "inventory_locations" ("tenant_id", "is_default");

CREATE UNIQUE INDEX ON "stock_items" ("tenant_id", "offering_id", "variant_id");

CREATE UNIQUE INDEX ON "stock_balances" ("tenant_id", "stock_item_id", "location_id");

CREATE INDEX ON "stock_movements" ("tenant_id", "created_at");

CREATE INDEX ON "stock_movements" ("tenant_id", "stock_item_id", "created_at");

CREATE INDEX ON "stock_movements" ("tenant_id", "reference_type", "reference_id");

CREATE INDEX ON "carts" ("tenant_id", "customer_id", "status");

CREATE INDEX ON "carts" ("tenant_id", "created_at");

CREATE INDEX ON "cart_items" ("tenant_id", "cart_id");

CREATE UNIQUE INDEX ON "orders" ("tenant_id", "order_number");

CREATE INDEX ON "orders" ("tenant_id", "customer_id");

CREATE INDEX ON "orders" ("tenant_id", "status");

CREATE INDEX ON "orders" ("tenant_id", "created_at");

CREATE INDEX ON "order_items" ("tenant_id", "order_id");

CREATE INDEX ON "service_bookings" ("tenant_id", "starts_at");

CREATE INDEX ON "service_bookings" ("tenant_id", "offering_id");

CREATE INDEX ON "service_bookings" ("tenant_id", "customer_id");

CREATE INDEX ON "customer_memberships" ("tenant_id", "customer_id", "membership_plan_id");

CREATE INDEX ON "customer_memberships" ("tenant_id", "status");

CREATE INDEX ON "customer_memberships" ("tenant_id", "expires_at");

CREATE UNIQUE INDEX ON "coupons" ("tenant_id", "code");

CREATE INDEX ON "coupons" ("tenant_id", "status");

CREATE INDEX ON "payment_methods" ("tenant_id", "provider");

CREATE INDEX ON "payments" ("tenant_id", "order_id");

CREATE INDEX ON "payments" ("tenant_id", "provider_payment_id");

CREATE UNIQUE INDEX ON "payments" ("tenant_id", "idempotency_key");

CREATE INDEX ON "payments" ("tenant_id", "status");

CREATE INDEX ON "refunds" ("tenant_id", "payment_id");

CREATE INDEX ON "refunds" ("tenant_id", "status");

CREATE UNIQUE INDEX ON "tax_documents" ("tenant_id", "doc_type", "series", "number");

CREATE UNIQUE INDEX ON "tax_documents" ("tenant_id", "order_id");

CREATE INDEX ON "tax_documents" ("tenant_id", "status");

CREATE UNIQUE INDEX ON "whatsapp_accounts" ("tenant_id", "phone_number_id");

CREATE INDEX ON "whatsapp_conversations" ("tenant_id", "whatsapp_account_id", "customer_id");

CREATE INDEX ON "whatsapp_conversations" ("tenant_id", "last_message_at");

CREATE INDEX ON "whatsapp_messages" ("tenant_id", "provider_message_id");

CREATE INDEX ON "whatsapp_messages" ("tenant_id", "conversation_id", "sent_at");

CREATE UNIQUE INDEX ON "whatsapp_templates" ("tenant_id", "name", "language");

CREATE UNIQUE INDEX ON "conversation_orders" ("tenant_id", "conversation_id", "order_id");

CREATE UNIQUE INDEX ON "webhook_events" ("tenant_id", "provider", "external_id");

CREATE INDEX ON "webhook_events" ("tenant_id", "status");

CREATE INDEX ON "webhook_events" ("tenant_id", "received_at");

CREATE INDEX ON "outbox_events" ("tenant_id", "status", "available_at");

CREATE INDEX ON "outbox_events" ("tenant_id", "topic", "created_at");

CREATE INDEX ON "audit_logs" ("tenant_id", "created_at");

CREATE INDEX ON "audit_logs" ("tenant_id", "entity_type", "entity_id");

CREATE INDEX ON "audit_logs" ("tenant_id", "actor_user_id", "created_at");

CREATE INDEX ON "prospects" ("tenant_id", "stage", "created_at");

CREATE INDEX ON "prospects" ("tenant_id", "phone_e164");

CREATE UNIQUE INDEX ON "reports" ("tenant_id", "period", "period_start", "period_end");

CREATE INDEX ON "reports" ("tenant_id", "created_at");

COMMENT ON COLUMN "tenants"."tax_id" IS 'RUC (PE) u otro identificador fiscal';

COMMENT ON COLUMN "tenants"."status" IS 'ACTIVE | SUSPENDED | CLOSED';

COMMENT ON COLUMN "tenant_settings"."scope" IS 'TENANT | STORE | USER';

COMMENT ON COLUMN "tenant_stores"."channel" IS 'WEB | WHATSAPP | POS';

COMMENT ON COLUMN "tenant_stores"."status" IS 'ACTIVE | INACTIVE';

COMMENT ON COLUMN "saas_subscriptions"."code" IS 'FREE | PRO | ENTERPRISE';

COMMENT ON COLUMN "membership_conditions"."key" IS 'max_users, max_stores, features.whatsapp, limits.messages_per_day, etc.';

COMMENT ON COLUMN "tenant_saas_subscriptions"."status" IS 'ACTIVE | PAST_DUE | CANCELLED';

COMMENT ON COLUMN "saas_invoices"."status" IS 'OPEN | PAID | VOID | UNCOLLECTIBLE';

COMMENT ON COLUMN "saas_invoices"."provider" IS 'Stripe/Culqi/etc';

COMMENT ON COLUMN "users"."status" IS 'ACTIVE | INVITED | BLOCKED';

COMMENT ON COLUMN "auth_identities"."provider" IS 'PASSWORD | GOOGLE | MICROSOFT | GITHUB | MAGIC_LINK';

COMMENT ON COLUMN "permissions"."key" IS 'orders.read, orders.write, catalog.manage, payments.refund, whatsapp.manage, etc.';

COMMENT ON COLUMN "customers"."status" IS 'ACTIVE | BLOCKED';

COMMENT ON COLUMN "catalogs"."status" IS 'ACTIVE | INACTIVE';

COMMENT ON COLUMN "store_offerings"."type" IS 'PRODUCT | SERVICE | MEMBERSHIP';

COMMENT ON COLUMN "store_offerings"."status" IS 'DRAFT | ACTIVE | ARCHIVED';

COMMENT ON COLUMN "store_offerings"."handle" IS 'SEO slug per tenant';

COMMENT ON COLUMN "store_offerings"."tax_code" IS 'optional mapping';

COMMENT ON COLUMN "store_offerings"."base_data" IS 'snapshot-ish flexible data (brand, specs, etc.)';

COMMENT ON COLUMN "option_types"."name" IS 'Talla, Color, etc.';

COMMENT ON COLUMN "store_variants"."status" IS 'ACTIVE | ARCHIVED';

COMMENT ON COLUMN "store_variants"."tax_rate" IS 'e.g. 0.18';

COMMENT ON COLUMN "product_details"."shipping_data" IS 'methods / pricing rules';

COMMENT ON COLUMN "service_details"."location_type" IS 'ONSITE | REMOTE | CUSTOMER_LOCATION';

COMMENT ON COLUMN "membership_plans"."billing_type" IS 'ONE_TIME | RECURRING';

COMMENT ON COLUMN "membership_plans"."period_unit" IS 'DAY | WEEK | MONTH | YEAR';

COMMENT ON COLUMN "membership_plans"."entitlements" IS 'feature access, limits, etc.';

COMMENT ON TABLE "prices" IS 'Use variant_id for SKU pricing; offering_id for simple pricing.';

COMMENT ON COLUMN "stock_movements"."movement_type" IS 'IN | OUT | ADJUST | RESERVE | RELEASE';

COMMENT ON COLUMN "stock_movements"."qty" IS 'positive int';

COMMENT ON COLUMN "stock_movements"."reference_type" IS 'ORDER | PURCHASE | MANUAL';

COMMENT ON COLUMN "carts"."status" IS 'ACTIVE | CHECKED_OUT | ABANDONED';

COMMENT ON COLUMN "carts"."source" IS 'WHATSAPP | WEB';

COMMENT ON COLUMN "orders"."status" IS 'DRAFT | PENDING_PAYMENT | PAID | PROCESSING | FULFILLED | CANCELLED | REFUNDED';

COMMENT ON COLUMN "orders"."channel" IS 'WHATSAPP | WEB | MANUAL';

COMMENT ON COLUMN "order_items"."type" IS 'PRODUCT | SERVICE | MEMBERSHIP';

COMMENT ON COLUMN "fulfillments"."status" IS 'PENDING | SHIPPED | DELIVERED | RETURNED | CANCELLED';

COMMENT ON COLUMN "service_bookings"."status" IS 'PENDING | CONFIRMED | COMPLETED | CANCELLED | NO_SHOW';

COMMENT ON COLUMN "customer_memberships"."status" IS 'ACTIVE | PAUSED | CANCELLED | EXPIRED';

COMMENT ON COLUMN "coupons"."status" IS 'ACTIVE | DISABLED | EXPIRED';

COMMENT ON COLUMN "coupons"."discount_type" IS 'PERCENT | FIXED';

COMMENT ON COLUMN "coupon_rules"."scope" IS 'ORDER | OFFERING | CATEGORY';

COMMENT ON COLUMN "coupon_rules"."rule_type" IS 'INCLUDE | EXCLUDE';

COMMENT ON COLUMN "coupon_rules"."rule" IS 'extra conditions';

COMMENT ON COLUMN "payment_methods"."provider" IS 'NIUBIZ | CULQI | YAPE | PLIN | STRIPE | MANUAL | COINBASE';

COMMENT ON COLUMN "payments"."status" IS 'PENDING | CONFIRMED | FAILED | REFUNDED | CANCELLED | PARTIALLY_REFUNDED';

COMMENT ON COLUMN "payments"."idempotency_key" IS 'generated key per attempt';

COMMENT ON COLUMN "refunds"."status" IS 'PENDING | CONFIRMED | FAILED';

COMMENT ON COLUMN "tax_documents"."doc_type" IS 'BOLETA | FACTURA';

COMMENT ON COLUMN "tax_documents"."status" IS 'PENDING | SENT | ACCEPTED | REJECTED';

COMMENT ON COLUMN "tax_documents"."customer_doc_type" IS 'DNI/RUC/CE';

COMMENT ON COLUMN "whatsapp_accounts"."provider" IS 'META_CLOUD_API | TWILIO | ZENVIA';

COMMENT ON COLUMN "whatsapp_conversations"."status" IS 'OPEN | CLOSED | ARCHIVED';

COMMENT ON COLUMN "whatsapp_messages"."direction" IS 'INBOUND | OUTBOUND';

COMMENT ON COLUMN "whatsapp_messages"."message_type" IS 'TEXT | IMAGE | AUDIO | VIDEO | DOCUMENT | LOCATION | INTERACTIVE | TEMPLATE';

COMMENT ON COLUMN "whatsapp_messages"."status" IS 'QUEUED | SENT | DELIVERED | READ | FAILED';

COMMENT ON COLUMN "whatsapp_templates"."category" IS 'TRANSACTIONAL | MARKETING | OTP';

COMMENT ON COLUMN "whatsapp_templates"."status" IS 'DRAFT | ACTIVE | DISABLED';

COMMENT ON COLUMN "webhook_events"."provider" IS 'WHATSAPP | PAYMENT';

COMMENT ON COLUMN "webhook_events"."status" IS 'RECEIVED | PROCESSED | FAILED | IGNORED';

COMMENT ON COLUMN "outbox_events"."topic" IS 'order.created, payment.confirmed, whatsapp.send, stock.updated, etc.';

COMMENT ON COLUMN "outbox_events"."status" IS 'PENDING | SENT | FAILED';

COMMENT ON COLUMN "prospects"."source" IS 'WHATSAPP | WEB | ADS | MANUAL';

COMMENT ON COLUMN "prospects"."stage" IS 'NEW | CONTACTED | QUALIFIED | LOST | WON';

COMMENT ON COLUMN "reports"."period" IS 'DAILY | WEEKLY | MONTHLY | YEARLY';

COMMENT ON COLUMN "reports"."metrics" IS 'sales, interactions, prospects, etc.';

ALTER TABLE "tenant_settings" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "tenant_stores" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "tenant_domains" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "membership_conditions" ADD FOREIGN KEY ("saas_subscription_id") REFERENCES "saas_subscriptions" ("id");

ALTER TABLE "tenant_saas_subscriptions" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "tenant_saas_subscriptions" ADD FOREIGN KEY ("saas_subscription_id") REFERENCES "saas_subscriptions" ("id");

ALTER TABLE "saas_invoices" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "saas_invoices" ADD FOREIGN KEY ("tenant_saas_subscription_id") REFERENCES "tenant_saas_subscriptions" ("id");

ALTER TABLE "users" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "users" ADD FOREIGN KEY ("invited_by_user_id") REFERENCES "users" ("id");

ALTER TABLE "user_profiles" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "user_profiles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "auth_identities" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "auth_identities" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "password_reset_tokens" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "password_reset_tokens" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "roles" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "role_permissions" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "role_permissions" ADD FOREIGN KEY ("role_id") REFERENCES "roles" ("id");

ALTER TABLE "role_permissions" ADD FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id");

ALTER TABLE "user_roles" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "user_roles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "user_roles" ADD FOREIGN KEY ("role_id") REFERENCES "roles" ("id");

ALTER TABLE "customers" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "tags" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "customer_tags" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "customer_tags" ADD FOREIGN KEY ("customer_id") REFERENCES "customers" ("id");

ALTER TABLE "customer_tags" ADD FOREIGN KEY ("tag_id") REFERENCES "tags" ("id");

ALTER TABLE "customer_addresses" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "customer_addresses" ADD FOREIGN KEY ("customer_id") REFERENCES "customers" ("id");

ALTER TABLE "catalogs" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "catalogs" ADD FOREIGN KEY ("store_id") REFERENCES "tenant_stores" ("id");

ALTER TABLE "categories" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "categories" ADD FOREIGN KEY ("catalog_id") REFERENCES "catalogs" ("id");

ALTER TABLE "categories" ADD FOREIGN KEY ("parent_id") REFERENCES "categories" ("id");

ALTER TABLE "store_offerings" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "store_offerings" ADD FOREIGN KEY ("catalog_id") REFERENCES "catalogs" ("id");

ALTER TABLE "store_offering_categories" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "store_offering_categories" ADD FOREIGN KEY ("offering_id") REFERENCES "store_offerings" ("id");

ALTER TABLE "store_offering_categories" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id");

ALTER TABLE "store_offering_images" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "store_offering_images" ADD FOREIGN KEY ("offering_id") REFERENCES "store_offerings" ("id");

ALTER TABLE "store_offering_attributes" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "store_offering_attributes" ADD FOREIGN KEY ("offering_id") REFERENCES "store_offerings" ("id");

ALTER TABLE "option_types" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "option_types" ADD FOREIGN KEY ("offering_id") REFERENCES "store_offerings" ("id");

ALTER TABLE "option_values" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "option_values" ADD FOREIGN KEY ("option_type_id") REFERENCES "option_types" ("id");

ALTER TABLE "store_variants" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "store_variants" ADD FOREIGN KEY ("offering_id") REFERENCES "store_offerings" ("id");

ALTER TABLE "store_variant_options" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "store_variant_options" ADD FOREIGN KEY ("variant_id") REFERENCES "store_variants" ("id");

ALTER TABLE "store_variant_options" ADD FOREIGN KEY ("option_value_id") REFERENCES "option_values" ("id");

ALTER TABLE "product_details" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "product_details" ADD FOREIGN KEY ("offering_id") REFERENCES "store_offerings" ("id");

ALTER TABLE "service_details" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "service_details" ADD FOREIGN KEY ("offering_id") REFERENCES "store_offerings" ("id");

ALTER TABLE "membership_plans" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "membership_plans" ADD FOREIGN KEY ("offering_id") REFERENCES "store_offerings" ("id");

ALTER TABLE "price_lists" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "price_lists" ADD FOREIGN KEY ("catalog_id") REFERENCES "catalogs" ("id");

ALTER TABLE "prices" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "prices" ADD FOREIGN KEY ("price_list_id") REFERENCES "price_lists" ("id");

ALTER TABLE "prices" ADD FOREIGN KEY ("offering_id") REFERENCES "store_offerings" ("id");

ALTER TABLE "prices" ADD FOREIGN KEY ("variant_id") REFERENCES "store_variants" ("id");

ALTER TABLE "inventory_locations" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "inventory_locations" ADD FOREIGN KEY ("store_id") REFERENCES "tenant_stores" ("id");

ALTER TABLE "stock_items" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "stock_items" ADD FOREIGN KEY ("offering_id") REFERENCES "store_offerings" ("id");

ALTER TABLE "stock_items" ADD FOREIGN KEY ("variant_id") REFERENCES "store_variants" ("id");

ALTER TABLE "stock_balances" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "stock_balances" ADD FOREIGN KEY ("stock_item_id") REFERENCES "stock_items" ("id");

ALTER TABLE "stock_balances" ADD FOREIGN KEY ("location_id") REFERENCES "inventory_locations" ("id");

ALTER TABLE "stock_movements" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "stock_movements" ADD FOREIGN KEY ("stock_item_id") REFERENCES "stock_items" ("id");

ALTER TABLE "stock_movements" ADD FOREIGN KEY ("location_id") REFERENCES "inventory_locations" ("id");

ALTER TABLE "stock_movements" ADD FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id");

ALTER TABLE "carts" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "carts" ADD FOREIGN KEY ("customer_id") REFERENCES "customers" ("id");

ALTER TABLE "carts" ADD FOREIGN KEY ("price_list_id") REFERENCES "price_lists" ("id");

ALTER TABLE "cart_items" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "cart_items" ADD FOREIGN KEY ("cart_id") REFERENCES "carts" ("id");

ALTER TABLE "cart_items" ADD FOREIGN KEY ("offering_id") REFERENCES "store_offerings" ("id");

ALTER TABLE "cart_items" ADD FOREIGN KEY ("variant_id") REFERENCES "store_variants" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("customer_id") REFERENCES "customers" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("price_list_id") REFERENCES "price_lists" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("coupon_id") REFERENCES "coupons" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("shipping_address_id") REFERENCES "customer_addresses" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("billing_address_id") REFERENCES "customer_addresses" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id");

ALTER TABLE "order_items" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "order_items" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id");

ALTER TABLE "order_items" ADD FOREIGN KEY ("offering_id") REFERENCES "store_offerings" ("id");

ALTER TABLE "order_items" ADD FOREIGN KEY ("variant_id") REFERENCES "store_variants" ("id");

ALTER TABLE "fulfillments" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "fulfillments" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id");

ALTER TABLE "service_bookings" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "service_bookings" ADD FOREIGN KEY ("offering_id") REFERENCES "store_offerings" ("id");

ALTER TABLE "service_bookings" ADD FOREIGN KEY ("customer_id") REFERENCES "customers" ("id");

ALTER TABLE "service_bookings" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id");

ALTER TABLE "service_bookings" ADD FOREIGN KEY ("assigned_user_id") REFERENCES "users" ("id");

ALTER TABLE "customer_memberships" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "customer_memberships" ADD FOREIGN KEY ("customer_id") REFERENCES "customers" ("id");

ALTER TABLE "customer_memberships" ADD FOREIGN KEY ("membership_plan_id") REFERENCES "membership_plans" ("id");

ALTER TABLE "customer_memberships" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id");

ALTER TABLE "coupons" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "coupon_rules" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "coupon_rules" ADD FOREIGN KEY ("coupon_id") REFERENCES "coupons" ("id");

ALTER TABLE "coupon_rules" ADD FOREIGN KEY ("offering_id") REFERENCES "store_offerings" ("id");

ALTER TABLE "coupon_rules" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id");

ALTER TABLE "payment_methods" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "payments" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "payments" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id");

ALTER TABLE "payments" ADD FOREIGN KEY ("method_id") REFERENCES "payment_methods" ("id");

ALTER TABLE "refunds" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "refunds" ADD FOREIGN KEY ("payment_id") REFERENCES "payments" ("id");

ALTER TABLE "refunds" ADD FOREIGN KEY ("requested_by_user_id") REFERENCES "users" ("id");

ALTER TABLE "tax_documents" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "tax_documents" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id");

ALTER TABLE "whatsapp_accounts" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "whatsapp_accounts" ADD FOREIGN KEY ("store_id") REFERENCES "tenant_stores" ("id");

ALTER TABLE "whatsapp_conversations" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "whatsapp_conversations" ADD FOREIGN KEY ("whatsapp_account_id") REFERENCES "whatsapp_accounts" ("id");

ALTER TABLE "whatsapp_conversations" ADD FOREIGN KEY ("customer_id") REFERENCES "customers" ("id");

ALTER TABLE "whatsapp_messages" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "whatsapp_messages" ADD FOREIGN KEY ("conversation_id") REFERENCES "whatsapp_conversations" ("id");

ALTER TABLE "whatsapp_templates" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "conversation_orders" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "conversation_orders" ADD FOREIGN KEY ("conversation_id") REFERENCES "whatsapp_conversations" ("id");

ALTER TABLE "conversation_orders" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id");

ALTER TABLE "webhook_events" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "outbox_events" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "audit_logs" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "audit_logs" ADD FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id");

ALTER TABLE "prospects" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "prospects" ADD FOREIGN KEY ("store_id") REFERENCES "tenant_stores" ("id");

ALTER TABLE "reports" ADD FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id");

ALTER TABLE "reports" ADD FOREIGN KEY ("store_id") REFERENCES "tenant_stores" ("id");
