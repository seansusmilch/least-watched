/*
 Warnings:
 
 - A unique constraint covering the columns `[embyId]` on the table `media_items` will be added. If there are existing duplicate values, this will fail.
 
 */
-- DropIndex
DROP INDEX "media_items_embyId_idx";
-- Cleanup: remove media items without an embyId prior to enforcing uniqueness
DELETE FROM "media_items"
WHERE "embyId" IS NULL
  OR TRIM("embyId") = '';
-- CreateIndex
CREATE UNIQUE INDEX "media_items_embyId_key" ON "media_items"("embyId");