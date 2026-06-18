-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0.06,
ALTER COLUMN "currency" SET DEFAULT 'MYR',
ALTER COLUMN "timezone" SET DEFAULT 'Asia/Kuala_Lumpur';
