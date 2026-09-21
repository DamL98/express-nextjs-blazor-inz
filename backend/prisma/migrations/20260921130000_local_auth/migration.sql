ALTER TABLE "users" ALTER COLUMN "google_id" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT,
                    ADD COLUMN "session_version" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "auth_tokens" (
    "token_hash" TEXT NOT NULL PRIMARY KEY,
    "purpose" TEXT NOT NULL,
    "user_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "auth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "auth_tokens_user_id_purpose_idx" ON "auth_tokens"("user_id", "purpose");
CREATE INDEX "auth_tokens_expires_at_idx" ON "auth_tokens"("expires_at");
