-- AlterTable
ALTER TABLE "media_items" ADD COLUMN "dateAdded" DATETIME;
ALTER TABLE "media_items" ADD COLUMN "mediaPath" TEXT;
ALTER TABLE "media_items" ADD COLUMN "sizeOnDisk" BIGINT;
ALTER TABLE "media_items" ADD COLUMN "source" TEXT;
