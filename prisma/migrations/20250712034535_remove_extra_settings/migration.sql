/*
  Warnings:

  - You are about to drop the column `enableSpaceAlerts` on the `radarr_settings` table. All the data in the column will be lost.
  - You are about to drop the column `enhancedFolderSettings` on the `radarr_settings` table. All the data in the column will be lost.
  - You are about to drop the column `showDetailedSpaceInfo` on the `radarr_settings` table. All the data in the column will be lost.
  - You are about to drop the column `spaceAlertThreshold` on the `radarr_settings` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_radarr_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "selectedFolders" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_radarr_settings" ("apiKey", "createdAt", "enabled", "id", "name", "selectedFolders", "updatedAt", "url") SELECT "apiKey", "createdAt", "enabled", "id", "name", "selectedFolders", "updatedAt", "url" FROM "radarr_settings";
DROP TABLE "radarr_settings";
ALTER TABLE "new_radarr_settings" RENAME TO "radarr_settings";
CREATE UNIQUE INDEX "radarr_settings_name_key" ON "radarr_settings"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
