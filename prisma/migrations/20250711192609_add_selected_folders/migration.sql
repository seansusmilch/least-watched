-- AlterTable
ALTER TABLE "emby_settings" ADD COLUMN "selectedFolders" TEXT;

-- AlterTable
ALTER TABLE "radarr_settings" ADD COLUMN "selectedFolders" TEXT;

-- AlterTable
ALTER TABLE "sonarr_settings" ADD COLUMN "selectedFolders" TEXT;
