-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "message" TEXT NOT NULL
);
-- CreateIndex
CREATE INDEX "events_timestamp_idx" ON "events"("timestamp");
-- CreateIndex
CREATE INDEX "events_component_idx" ON "events"("component");
-- CreateIndex
CREATE INDEX "events_level_idx" ON "events"("level");