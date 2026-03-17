/*
  Warnings:

  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_actor_user_id_fkey";

-- DropForeignKey
ALTER TABLE "auth_identities" DROP CONSTRAINT "auth_identities_user_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_requested_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "service_bookings" DROP CONSTRAINT "service_bookings_assigned_user_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_invited_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_tenant_id_fkey";

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "appusers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
    "email_verified_at" TIMESTAMPTZ(6),
    "invited_by_user_id" UUID,
    "invited_at" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "appusers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appusers_tenant_id_status_idx" ON "appusers"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "appusers_tenant_id_email_key" ON "appusers"("tenant_id", "email");

-- AddForeignKey
ALTER TABLE "appusers" ADD CONSTRAINT "appusers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appusers" ADD CONSTRAINT "appusers_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "appusers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "appusers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "appusers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "appusers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "appusers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "appusers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "appusers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "appusers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "appusers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "appusers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
