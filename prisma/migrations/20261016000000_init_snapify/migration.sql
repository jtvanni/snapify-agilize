-- This migration is intentionally restricted to the dedicated snapify schema.
-- The schema must be bootstrapped with snapify_prisma as its owner before deploy.
SET search_path TO "snapify";

CREATE TABLE "snapify"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "snapify"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "snapify"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "snapify"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "snapify"."Video" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sharing" BOOLEAN NOT NULL DEFAULT false,
    "delete_after_link_expires" BOOLEAN NOT NULL DEFAULT false,
    "shareLinkExpiresAt" TIMESTAMP(3),
    "linkShareSeo" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "snapify"."User"("email");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "snapify"."Account"("provider", "providerAccountId");
CREATE INDEX "Account_userId_idx" ON "snapify"."Account"("userId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "snapify"."Session"("sessionToken");
CREATE INDEX "Session_userId_idx" ON "snapify"."Session"("userId");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "snapify"."VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "snapify"."VerificationToken"("identifier", "token");
CREATE INDEX "Video_userId_idx" ON "snapify"."Video"("userId");
