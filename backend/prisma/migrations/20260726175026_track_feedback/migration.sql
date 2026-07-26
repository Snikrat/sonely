-- CreateTable
CREATE TABLE "TrackFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackName" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrackFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackFeedback_userId_trackName_artistName_key" ON "TrackFeedback"("userId", "trackName", "artistName");
