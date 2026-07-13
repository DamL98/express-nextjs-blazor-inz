ALTER TABLE "users" RENAME COLUMN "firebase_uid" TO "google_id";
ALTER INDEX "users_firebase_uid_key" RENAME TO "users_google_id_key";
