/*
  Warnings:

  - A unique constraint covering the columns `[embyId]` on the table `media_items` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "media_items_embyId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "media_items_embyId_key" ON "media_items"("embyId");
