-- GitHub OAuth may return this value when refresh tokens are enabled.
ALTER TABLE "snapify"."Account"
ADD COLUMN "refresh_token_expires_in" INTEGER;
