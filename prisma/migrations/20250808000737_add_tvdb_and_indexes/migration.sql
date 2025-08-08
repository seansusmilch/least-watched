-- AlterTable
ALTER TABLE "media_items" ADD COLUMN "tvdbId" INTEGER;

-- CreateIndex
CREATE INDEX "media_items_tmdbId_idx" ON "media_items"("tmdbId");

-- CreateIndex
CREATE INDEX "media_items_imdbId_idx" ON "media_items"("imdbId");

-- CreateIndex
CREATE INDEX "media_items_tvdbId_idx" ON "media_items"("tvdbId");

-- CreateIndex
CREATE INDEX "media_items_embyId_idx" ON "media_items"("embyId");
