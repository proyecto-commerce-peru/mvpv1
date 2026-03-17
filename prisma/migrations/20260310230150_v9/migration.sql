/*
  Warnings:

  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
BEGIN;

ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_invited_by_user_id_fkey";
ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "user_profiles_user_id_fkey";
ALTER TABLE "auth_identities" DROP CONSTRAINT IF EXISTS "auth_identities_user_id_fkey";
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT IF EXISTS "password_reset_tokens_user_id_fkey";
ALTER TABLE "user_roles" DROP CONSTRAINT IF EXISTS "user_roles_user_id_fkey";
ALTER TABLE "stock_movements" DROP CONSTRAINT IF EXISTS "stock_movements_created_by_user_id_fkey";
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_created_by_user_id_fkey";
ALTER TABLE "service_bookings" DROP CONSTRAINT IF EXISTS "service_bookings_assigned_user_id_fkey";
ALTER TABLE "refunds" DROP CONSTRAINT IF EXISTS "refunds_requested_by_user_id_fkey";
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_actor_user_id_fkey";

ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_pkey";

ALTER TABLE "users"
  ALTER COLUMN "id" TYPE VARCHAR(255) USING "id"::text,
  ALTER COLUMN "invited_by_user_id" TYPE VARCHAR(255) USING "invited_by_user_id"::text;

ALTER TABLE "user_profiles"
  ALTER COLUMN "user_id" TYPE VARCHAR(255) USING "user_id"::text;

ALTER TABLE "auth_identities"
  ALTER COLUMN "user_id" TYPE VARCHAR(255) USING "user_id"::text;

ALTER TABLE "password_reset_tokens"
  ALTER COLUMN "user_id" TYPE VARCHAR(255) USING "user_id"::text;

ALTER TABLE "user_roles"
  ALTER COLUMN "user_id" TYPE VARCHAR(255) USING "user_id"::text;

ALTER TABLE "stock_movements"
  ALTER COLUMN "created_by_user_id" TYPE VARCHAR(255) USING "created_by_user_id"::text;

ALTER TABLE "orders"
  ALTER COLUMN "created_by_user_id" TYPE VARCHAR(255) USING "created_by_user_id"::text;

ALTER TABLE "service_bookings"
  ALTER COLUMN "assigned_user_id" TYPE VARCHAR(255) USING "assigned_user_id"::text;

ALTER TABLE "refunds"
  ALTER COLUMN "requested_by_user_id" TYPE VARCHAR(255) USING "requested_by_user_id"::text;

ALTER TABLE "audit_logs"
  ALTER COLUMN "actor_user_id" TYPE VARCHAR(255) USING "actor_user_id"::text;

ALTER TABLE "users"
  ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

ALTER TABLE "users"
  ADD CONSTRAINT "users_invited_by_user_id_fkey"
  FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_profiles"
  ADD CONSTRAINT "user_profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "auth_identities"
  ADD CONSTRAINT "auth_identities_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "password_reset_tokens"
  ADD CONSTRAINT "password_reset_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_roles"
  ADD CONSTRAINT "user_roles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "service_bookings"
  ADD CONSTRAINT "service_bookings_assigned_user_id_fkey"
  FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "refunds"
  ADD CONSTRAINT "refunds_requested_by_user_id_fkey"
  FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
