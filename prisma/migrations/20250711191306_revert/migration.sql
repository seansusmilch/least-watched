/*
  Warnings:

  - You are about to drop the column `folderRemainingSpacePercent` on the `media_items` table. All the data in the column will be lost.

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
    "year" INTEGER,
    "lastWatched" DATETIME,
    "watchCount" INTEGER NOT NULL DEFAULT 0,
    "sonarrId" INTEGER,
    "radarrId" INTEGER,
    "embyId" TEXT,
    "mediaPath" TEXT,
    "parentFolder" TEXT,
    "sizeOnDisk" BIGINT,
    "dateAdded" DATETIME,
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
    "genres" TEXT,
    "overview" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_media_items" ("completionPercentage", "createdAt", "dateAdded", "embyId", "episodesOnDisk", "fullyWatched", "genres", "id", "imdbId", "imdbRating", "lastWatched", "mediaPath", "monitored", "overview", "parentFolder", "playProgress", "quality", "qualityScore", "radarrId", "runtime", "seasonCount", "sizeOnDisk", "sizePerHour", "sonarrId", "source", "title", "tmdbId", "tmdbRating", "totalEpisodes", "type", "updatedAt", "watchCount", "year") SELECT "completionPercentage", "createdAt", "dateAdded", "embyId", "episodesOnDisk", "fullyWatched", "genres", "id", "imdbId", "imdbRating", "lastWatched", "mediaPath", "monitored", "overview", "parentFolder", "playProgress", "quality", "qualityScore", "radarrId", "runtime", "seasonCount", "sizeOnDisk", "sizePerHour", "sonarrId", "source", "title", "tmdbId", "tmdbRating", "totalEpisodes", "type", "updatedAt", "watchCount", "year" FROM "media_items";
DROP TABLE "media_items";
ALTER TABLE "new_media_items" RENAME TO "media_items";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
