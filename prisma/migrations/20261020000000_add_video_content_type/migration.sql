SET search_path TO "snapify";

ALTER TABLE "snapify"."Video"
ADD COLUMN "contentType" TEXT NOT NULL DEFAULT 'video/webm';
