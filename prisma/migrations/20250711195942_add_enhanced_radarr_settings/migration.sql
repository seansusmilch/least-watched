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
    "enhancedFolderSettings" TEXT,
    "showDetailedSpaceInfo" BOOLEAN NOT NULL DEFAULT false,
    "enableSpaceAlerts" BOOLEAN NOT NULL DEFAULT false,
    "spaceAlertThreshold" INTEGER NOT NULL DEFAULT 10,
    "enableMovieCountTracking" BOOLEAN NOT NULL DEFAULT false,
    "enableQualityBreakdown" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_radarr_settings" ("apiKey", "createdAt", "enabled", "id", "name", "selectedFolders", "updatedAt", "url") SELECT "apiKey", "createdAt", "enabled", "id", "name", "selectedFolders", "updatedAt", "url" FROM "radarr_settings";
DROP TABLE "radarr_settings";
ALTER TABLE "new_radarr_settings" RENAME TO "radarr_settings";
CREATE UNIQUE INDEX "radarr_settings_name_key" ON "radarr_settings"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
