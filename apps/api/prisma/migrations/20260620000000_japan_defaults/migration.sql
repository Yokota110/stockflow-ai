-- Update existing demo/local databases to Japan defaults.
UPDATE "Organization"
SET
  "currency" = 'JPY',
  "timezone" = 'Asia/Tokyo',
  "taxRate" = 0.10
WHERE
  "currency" = 'MYR'
  OR "timezone" = 'Asia/Kuala_Lumpur'
  OR "taxRate" = 0.06;

ALTER TABLE "Organization"
ALTER COLUMN "taxRate" SET DEFAULT 0.10,
ALTER COLUMN "currency" SET DEFAULT 'JPY',
ALTER COLUMN "timezone" SET DEFAULT 'Asia/Tokyo';
