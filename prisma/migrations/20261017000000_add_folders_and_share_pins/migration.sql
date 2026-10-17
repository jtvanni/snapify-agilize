SET search_path TO "snapify";

CREATE TABLE "snapify"."Folder" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sharing" BOOLEAN NOT NULL DEFAULT false,
    "sharePinHash" TEXT,
    "shareAccessVersion" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "snapify"."Video"
ADD COLUMN "sharePinHash" TEXT,
ADD COLUMN "shareAccessVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "folderId" TEXT;

CREATE INDEX "Folder_userId_idx" ON "snapify"."Folder"("userId");
CREATE INDEX "Video_folderId_idx" ON "snapify"."Video"("folderId");
