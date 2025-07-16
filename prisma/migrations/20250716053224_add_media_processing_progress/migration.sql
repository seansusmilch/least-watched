-- CreateTable
CREATE TABLE "media_processing_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "progressId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "current" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "currentItem" TEXT NOT NULL DEFAULT '',
    "percentage" INTEGER NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "media_processing_progress_progressId_key" ON "media_processing_progress"("progressId");
