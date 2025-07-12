-- CreateTable
CREATE TABLE "sonarr_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "selectedFolders" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "radarr_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "selectedFolders" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "emby_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "userId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "selectedFolders" TEXT
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "media_items" (
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
    "deletionScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "sonarr_settings_name_key" ON "sonarr_settings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "radarr_settings_name_key" ON "radarr_settings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "emby_settings_name_key" ON "emby_settings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");

