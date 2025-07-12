-- AlterTable
ALTER TABLE "media_items" ADD COLUMN "completionPercentage" INTEGER;
ALTER TABLE "media_items" ADD COLUMN "deletionScore" INTEGER;
ALTER TABLE "media_items" ADD COLUMN "episodesOnDisk" INTEGER;
ALTER TABLE "media_items" ADD COLUMN "fullyWatched" BOOLEAN;
ALTER TABLE "media_items" ADD COLUMN "genres" TEXT;
ALTER TABLE "media_items" ADD COLUMN "imdbRating" REAL;
ALTER TABLE "media_items" ADD COLUMN "monitored" BOOLEAN;
ALTER TABLE "media_items" ADD COLUMN "overview" TEXT;
ALTER TABLE "media_items" ADD COLUMN "playProgress" INTEGER;
ALTER TABLE "media_items" ADD COLUMN "quality" TEXT;
ALTER TABLE "media_items" ADD COLUMN "qualityScore" INTEGER;
ALTER TABLE "media_items" ADD COLUMN "runtime" INTEGER;
ALTER TABLE "media_items" ADD COLUMN "seasonCount" INTEGER;
ALTER TABLE "media_items" ADD COLUMN "sizePerHour" REAL;
ALTER TABLE "media_items" ADD COLUMN "tmdbRating" REAL;
ALTER TABLE "media_items" ADD COLUMN "totalEpisodes" INTEGER;
