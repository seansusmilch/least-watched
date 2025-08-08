/*
 Warnings:
 
 - A unique constraint covering the columns `[embyId]` on the table `media_items` will be added. If there are existing duplicate values, this will fail.
 
 */
-- Drop indexes defensively in case of a previous partial run
DROP INDEX IF EXISTS "media_items_embyId_idx";
DROP INDEX IF EXISTS "media_items_embyId_key";
-- Cleanup: remove media items without an embyId prior to enforcing uniqueness
DELETE FROM "media_items"
WHERE "embyId" IS NULL
  OR TRIM("embyId") = '';
-- De-duplicate by keeping the most recently updated row per embyId
WITH ranked AS (
  SELECT rowid,
    ROW_NUMBER() OVER (
      PARTITION BY "embyId"
      ORDER BY ("updatedAt" IS NULL) ASC,
        "updatedAt" DESC,
        ("createdAt" IS NULL) ASC,
        "createdAt" DESC,
        rowid DESC
    ) AS rn
  FROM "media_items"
  WHERE "embyId" IS NOT NULL
    AND TRIM("embyId") <> ''
),
to_delete AS (
  SELECT rowid
  FROM ranked
  WHERE rn > 1
)
DELETE FROM "media_items"
WHERE rowid IN (
    SELECT rowid
    FROM to_delete
  );
-- Create unique index after cleanup
CREATE UNIQUE INDEX "media_items_embyId_key" ON "media_items"("embyId");