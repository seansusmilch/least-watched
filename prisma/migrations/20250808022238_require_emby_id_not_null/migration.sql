/*
  Warnings:

  - Made the column `embyId` on table `media_items` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_media_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tmdbId" INTEGER,
    "imdbId" TEXT,
    "tvdbId" INTEGER,
    "year" INTEGER,
    "lastWatched" DATETIME,
    "watchCount" INTEGER NOT NULL DEFAULT 0,
    "sonarrId" INTEGER,
    "radarrId" INTEGER,
    "embyId" TEXT NOT NULL,
    "mediaPath" TEXT,
    "parentFolder" TEXT,
    "sizeOnDisk" BIGINT,
    "dateAddedEmby" DATETIME,
    "dateAddedArr" DATETIME,
    "source" TEXT,
    "quality" TEXT,
    "qualityScore" INTEGER,
    "episodesOnDisk" INTEGER,
    "totalEpisodes" INTEGER,
    "seasonCount" INTEGER,
    "completionPercentage" INTEGER,
    "monitored" BOOLEAN,
    "imdbRating" REAL,
    "tmdbRating" REAL,
    "playProgress" INTEGER,
    "fullyWatched" BOOLEAN,
    "runtime" INTEGER,
    "sizePerHour" REAL,
    "genres" JSONB NOT NULL,
    "overview" TEXT,
    "deletionScore" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_media_items" ("completionPercentage", "createdAt", "dateAddedArr", "dateAddedEmby", "deletionScore", "embyId", "episodesOnDisk", "fullyWatched", "genres", "id", "imdbId", "imdbRating", "lastWatched", "mediaPath", "monitored", "overview", "parentFolder", "playProgress", "quality", "qualityScore", "radarrId", "runtime", "seasonCount", "sizeOnDisk", "sizePerHour", "sonarrId", "source", "title", "tmdbId", "tmdbRating", "totalEpisodes", "tvdbId", "type", "updatedAt", "watchCount", "year") SELECT "completionPercentage", "createdAt", "dateAddedArr", "dateAddedEmby", "deletionScore", "embyId", "episodesOnDisk", "fullyWatched", "genres", "id", "imdbId", "imdbRating", "lastWatched", "mediaPath", "monitored", "overview", "parentFolder", "playProgress", "quality", "qualityScore", "radarrId", "runtime", "seasonCount", "sizeOnDisk", "sizePerHour", "sonarrId", "source", "title", "tmdbId", "tmdbRating", "totalEpisodes", "tvdbId", "type", "updatedAt", "watchCount", "year" FROM "media_items";
DROP TABLE "media_items";
ALTER TABLE "new_media_items" RENAME TO "media_items";
CREATE UNIQUE INDEX "media_items_embyId_key" ON "media_items"("embyId");
CREATE INDEX "media_items_tmdbId_idx" ON "media_items"("tmdbId");
CREATE INDEX "media_items_imdbId_idx" ON "media_items"("imdbId");
CREATE INDEX "media_items_tvdbId_idx" ON "media_items"("tvdbId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
