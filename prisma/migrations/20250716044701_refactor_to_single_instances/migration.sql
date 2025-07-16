/*
  Warnings:

  - You are about to drop the `emby_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `radarr_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sonarr_settings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "emby_settings";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "radarr_settings";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "sonarr_settings";
PRAGMA foreign_keys=on;
