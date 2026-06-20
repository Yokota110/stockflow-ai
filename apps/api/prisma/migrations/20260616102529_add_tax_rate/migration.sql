-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0.10,
ALTER COLUMN "currency" SET DEFAULT 'JPY',
ALTER COLUMN "timezone" SET DEFAULT 'Asia/Tokyo';
