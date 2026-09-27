import { describe, expect, it } from "vitest";

import { emailSchema, loginSchema, registerSchema } from "../../src/modules/auth/auth.validation.js";

describe("Walidacja konta lokalnego", () => {
  it("akceptuje poprawną rejestrację i normalizuje dane", () => {
    const result = registerSchema.parse({
      email: "  USER@EXAMPLE.COM ",
      fullName: " Damian Kowalski ",
      password: "Dlugie haslo 123456789!",
    });

    expect(result).toMatchObject({ email: "user@example.com", fullName: "Damian Kowalski" });
  });

  it("odrzuca zbyt krótkie hasło i nazwę", () => {
    expect(registerSchema.safeParse({
      email: "user@example.com",
      fullName: "Ja",
      password: "za krótkie",
    }).success).toBe(false);
  });

  it("wymaga poprawnego e-maila przy logowaniu i wysyłaniu wiadomości", () => {
    expect(loginSchema.safeParse({ email: "niepoprawny", password: "Dlugie haslo 123456789!" }).success).toBe(false);
    expect(emailSchema.safeParse({ email: "niepoprawny", redirectTo: "http://localhost:3000" }).success).toBe(false);
  });
});
