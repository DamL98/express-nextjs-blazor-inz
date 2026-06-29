import request from "supertest";
import { describe, expect, it, vi } from "vitest";

const { verifyIdTokenMock } = vi.hoisted(() => ({
  verifyIdTokenMock: vi.fn(async (token) => {
    if (token === "invalid-token") {
      throw new Error("invalid token");
    }

    return {
      uid: "auth-test-user",
      email: "user@example.com",
      name: "Jan Kowalski",
      picture: "https://example.com/avatar.png",
      email_verified: true,
    };
  }),
}));

vi.mock("../../src/config/firebase.js", () => ({
  getFirebaseAuth: () => ({ verifyIdToken: verifyIdTokenMock }),
}));

import { app } from "../../src/app.js";

describe("Firebase Auth API", () => {
  it("GET /api/v1/auth/me wymaga tokenu", async () => {
    const response = await request(app).get("/api/v1/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTH_TOKEN_REQUIRED");
  });

  it("POST /api/v1/auth/session synchronizuje konto z PostgreSQL", async () => {
    const response = await request(app)
      .post("/api/v1/auth/session")
      .set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe("user@example.com");
    expect(response.body.data.firebaseUid).toBe("auth-test-user");
    expect(response.body.data.role.name).toBe("user");
  });

  it("GET /api/v1/auth/me odrzuca nieprawidłowy token", async () => {
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTH_TOKEN_INVALID");
  });
});
