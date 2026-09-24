import { createHash } from "node:crypto";

//hasła korzystają osobno z funkcji hashowania Argon2id
export function hashAuthToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
