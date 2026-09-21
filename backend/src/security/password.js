import argon2 from "argon2";

export function hashPassword(password) {
  return argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

// Brak konta również wymaga kosztownego sprawdzenia hasła
const dummyHash = hashPassword("nieuzywane-haslo-do-weryfikacji");

export async function verifyPassword(hash, password) {
  const valid = await argon2.verify(hash || await dummyHash, password);
  return Boolean(hash) && valid;
}
