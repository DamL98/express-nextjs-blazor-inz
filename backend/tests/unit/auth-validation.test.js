import { describe, expect, it } from "vitest";
import {
  registerSchema, loginSchema, emailSchema, resetPasswordSchema,
  changePasswordSchema, linkGoogleSchema,
} from "../../src/modules/auth/auth.validation.js";

const base = {
  email: "user@example.com",
  fullName: "User",
  password: "a".repeat(12),
  redirectTo: "http://localhost:3000/auth/action",
};

describe("Limity danych konta lokalnego", () => {
  it.each([2, 3, 32, 33])("sprawdza nazwę o długości %i po usunięciu skrajnych spacji", (length) => {
    const result = registerSchema.safeParse({ ...base, fullName: `  ${"a".repeat(length)}  ` });
    expect(result.success).toBe(length >= 3 && length <= 32);
    if (result.success) expect(result.data.fullName).toHaveLength(length);
  });

  it.each([11, 12, 128, 129])("stosuje limit hasła %i we wszystkich operacjach", (length) => {
    const password = "a".repeat(length);
    const valid = length >= 12 && length <= 128;
    const results = [
      registerSchema.safeParse({ ...base, password }),
      loginSchema.safeParse({ email: base.email, password }),
      resetPasswordSchema.safeParse({ token: "a".repeat(64), password }),
      changePasswordSchema.safeParse({ currentPassword: base.password, password }),
      changePasswordSchema.safeParse({ currentPassword: password, password: base.password }),
      linkGoogleSchema.safeParse({ password, redirectTo: base.redirectTo }),
    ];
    for (const result of results) expect(result.success).toBe(valid);
  });

  it.each([254, 255])("sprawdza maksymalną długość e-maila %i", (length) => {
    const email = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(length - 193)}`;
    expect(email).toHaveLength(length);
    expect(emailSchema.safeParse({ email, redirectTo: base.redirectTo }).success).toBe(length === 254);
  });

  it("wymaga poprawnego adresu niezależnie od jego długości i normalizuje e-mail", () => {
    for (const email of ["ab", "abc", "a@b"]) {
      expect(emailSchema.safeParse({ email, redirectTo: base.redirectTo }).success).toBe(false);
    }
    expect(emailSchema.parse({ email: "  USER@EXAMPLE.COM  ", redirectTo: base.redirectTo }).email).toBe(base.email);
  });
});

