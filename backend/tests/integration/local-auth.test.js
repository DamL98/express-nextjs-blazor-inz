import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const sendAuthMail = vi.fn();
vi.mock("../../src/config/mail.js", () => ({ sendAuthMail }));

import { app } from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";

const API = "/api/v1/auth";
const email = "local-auth@example.com";
const password = "Dlugie haslo testowe 321!";

beforeAll(() => prisma.user.deleteMany({ where: { email } }));
afterAll(() => prisma.user.deleteMany({ where: { email } }));

describe("Local auth API", () => {
  it("rejestruje aktywne konto bez wysylki e-maila i pozwala sie zalogowac", async () => {
    const registered = await request(app)
      .post(`${API}/register`)
      .send({ email, password, fullName: "Test lokalny" });

    const loggedIn = await request(app)
      .post(`${API}/login`)
      .send({ email, password });

    expect(registered).toMatchObject({ status: 200, body: { success: true } });
    expect(sendAuthMail).not.toHaveBeenCalled();
    expect(loggedIn).toMatchObject({
      status: 200,
      body: {
        data: {
          user: {
            email,
            hasLocalPassword: true
          }
        }
      },
    });
  });

  it("nie ujawnia, czy bledne dane logowania wskazuja na konto", async () => {
    const [known, missing] = await Promise.all([
      request(app)
        .post(`${API}/login`)
        .send({ email, password: "niepoprawne haslo" }),
      request(app)
        .post(`${API}/login`)
        .send({ email: "missing@example.com", password }),
    ]);

    expect(known).toMatchObject({ status: 401, body: { code: "AUTH_CREDENTIALS_INVALID" } });
    expect(missing).toMatchObject({ status: 401, body: { code: "AUTH_CREDENTIALS_INVALID" } });
  });
});
