-- Existing Google identifiers are retained as temporary Firebase identifiers.
-- On the first successful login, the auth synchronization replaces them by email.
ALTER TABLE "users" RENAME COLUMN "google_id" TO "firebase_uid";

ALTER TABLE "users"
ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "last_login_at" TIMESTAMP(3);

ALTER INDEX "users_google_id_key" RENAME TO "users_firebase_uid_key";
