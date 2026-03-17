/*
  Warnings:

  - You are about to drop the `auth_account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `auth_session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `auth_user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `auth_verification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "auth_account" DROP CONSTRAINT "auth_account_userId_fkey";

-- DropForeignKey
ALTER TABLE "auth_session" DROP CONSTRAINT "auth_session_userId_fkey";

-- DropTable
DROP TABLE "auth_account";

-- DropTable
DROP TABLE "auth_session";

-- DropTable
DROP TABLE "auth_user";

-- DropTable
DROP TABLE "auth_verification";

-- CreateTable
CREATE TABLE "ba_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ba_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ba_sessions" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "tenantId" UUID,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ba_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ba_accounts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ba_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ba_verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ba_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ba_users_email_key" ON "ba_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ba_sessions_token_key" ON "ba_sessions"("token");

-- CreateIndex
CREATE INDEX "ba_sessions_userId_idx" ON "ba_sessions"("userId");

-- AddForeignKey
ALTER TABLE "ba_sessions" ADD CONSTRAINT "ba_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ba_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ba_accounts" ADD CONSTRAINT "ba_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ba_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
