-- AlterTable
ALTER TABLE "auth_account" ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "auth_session" ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "auth_user" ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "auth_verification" ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);
