import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { mail, profile } = vi.hoisted(() => ({ mail: vi.fn(), profile: vi.fn() }));
vi.mock("../../src/config/mail.js", () => ({ sendAuthMail: mail }));
vi.mock("../../src/config/google-oauth.js", async (original) => ({
  ...await original(),
  exchangeGoogleCodeForProfile: profile,
  verifyGoogleIdToken: profile,
  buildGoogleAuthorizationUrl: ({ state }) => `https://accounts.google.com/auth?state=${state}`,
}));

import { app } from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";
import { hashPassword } from "../../src/security/password.js";
import { createSessionToken } from "../../src/security/jwt.js";
import { authTokenRepository } from "../../src/repositories/auth-token.repository.js";

const API = "/api/v1/auth";
const email = "local-auth-test@example.com";
const password = "Dlugie haslo testowe 123!";
const redirectTo = "http://localhost:3000/auth/action";
const cookies = (response) => response.headers["set-cookie"].map((value) => value.split(";")[0]);
const lastToken = () => new URL(mail.mock.lastCall[2].match(/https?:\/\/\S+/)[0]).hash.split("token=")[1];
let user;
let session;

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: "local-auth-test" } } });
});
afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: "local-auth-test" } } });
});

describe("Konta lokalne i laczenie Google", () => {
  it("rejestruje, wymaga potwierdzenia, nie ujawnia hasha i loguje wspolna sesja", async () => {
    const registered = await request(app).post(`${API}/register`).send({ email, password, fullName: "Lokalny", redirectTo, role: "admin" });
    expect(registered.status).toBe(200);
    const pending = await request(app).post(`${API}/login`).send({ email, password });
    expect(pending.status).toBe(403);
    const token = lastToken();
    expect((await request(app).post(`${API}/verify-email`).send({ token })).status).toBe(200);
    expect((await request(app).post(`${API}/verify-email`).send({ token })).status).toBe(400);
    const loggedIn = await request(app).post(`${API}/login`).send({ email: email.toUpperCase(), password });
    expect(loggedIn.status).toBe(200);
    expect(loggedIn.body.data.user).toMatchObject({ googleId: null, hasLocalPassword: true, role: { name: "user" } });
    expect(loggedIn.body.data.user).not.toHaveProperty("passwordHash");
    session = loggedIn.body.data.token;
    user = loggedIn.body.data.user;
    const me = await request(app).get(`${API}/me`).set("Cookie", cookies(loggedIn));
    expect(me.body.data.id).toBe(user.id);
    expect(me.body.data).not.toHaveProperty("passwordHash");
    expect((await prisma.user.findUnique({ where: { email } })).passwordHash).toMatch(/^\$argon2id\$/);
  });

  it("odrzuca krotkie haslo, obce originy i nie ujawnia istnienia konta przy logowaniu", async () => {
    expect((await request(app).post(`${API}/register`).send({ email, fullName: "Test", password: "short", redirectTo })).status).toBe(400);
    expect((await request(app).post(`${API}/login`).set("Origin", "https://obca.example").send({ email, password })).status).toBe(403);
    for (const loginEmail of [email, "local-auth-test-missing@example.com"]) {
      const result = await request(app).post(`${API}/login`).send({ email: loginEmail, password: "zle haslo" });
      expect(result.status).toBe(401);
      expect(result.body.code).toBe("AUTH_CREDENTIALS_INVALID");
    }
  });

  it("nie laczy automatycznie kont po adresie e-mail", async () => {
    profile.mockResolvedValue({ googleId: "local-auth-test-google", email, fullName: "Google", emailVerified: true });
    const response = await request(app).post(`${API}/session`).send({ idToken: "mock" });
    expect(response.status).toBe(409);
    expect((await prisma.user.findUnique({ where: { email } })).googleId).toBeNull();
  });

  it("laczenie wymaga sesji, hasla i przegladarki inicjujacej OAuth; zachowuje User.id i e-mail", async () => {
    expect((await request(app).post(`${API}/google/link`).send({ password, redirectTo })).status).toBe(401);
    expect((await request(app).post(`${API}/google/link`).set("Authorization", `Bearer ${session}`).send({ password: "zle", redirectTo })).status).toBe(401);
    const start = await request(app).post(`${API}/google/link`).set("Authorization", `Bearer ${session}`).send({ password, redirectTo });
    expect(start.status).toBe(200);
    const state = new URL(start.body.data.authorizationUrl).searchParams.get("state");
    const previousCalls = profile.mock.calls.length;
    expect((await request(app).get(`${API}/google/callback`).query({ state, code: "mock" })).status).toBe(400);
    expect(profile.mock.calls).toHaveLength(previousCalls);
    profile.mockResolvedValue({ googleId: "local-auth-test-google", email: "inny-adres-google@example.com", emailVerified: true });
    const callback = () => request(app).get(`${API}/google/callback`).set("Cookie", cookies(start)).set("Authorization", `Bearer ${session}`).query({ state, code: "mock" });
    expect((await callback()).headers.location).toContain("googleLink=success");
    expect((await callback()).status).toBe(400);
    const linked = await prisma.user.findUnique({ where: { email } });
    expect(linked.id).toBe(user.id);
    expect(linked.googleId).toBe("local-auth-test-google");
    const googleLogin = await request(app).post(`${API}/session`).send({ idToken: "mock" });
    expect(googleLogin.body.data.user.id).toBe(user.id);
    expect(googleLogin.body.data.user.email).toBe(email);
    expect(googleLogin.body.data.user).not.toHaveProperty("passwordHash");
  });

  it("odrzuca polaczenie Google nalezacego do innego konta", async () => {
    const other = await prisma.user.create({ data: {
      email: "local-auth-test-other@example.com", fullName: "Inny", emailVerified: true,
      passwordHash: await hashPassword(password), role: { connect: { name: "user" } },
    }, include: { role: true } });
    const otherSession = createSessionToken(other);
    const start = await request(app).post(`${API}/google/link`).set("Authorization", `Bearer ${otherSession}`).send({ password, redirectTo });
    const state = new URL(start.body.data.authorizationUrl).searchParams.get("state");
    const result = await request(app).get(`${API}/google/callback`).set("Cookie", cookies(start)).set("Authorization", `Bearer ${otherSession}`).query({ state, code: "mock" });
    expect(result.headers.location).toContain("account_link_conflict");
    expect((await prisma.user.findUnique({ where: { id: other.id } })).googleId).toBeNull();
  });

  it("zmiana hasla uniewaznia poprzednie sesje", async () => {
    await authTokenRepository.create("cd".repeat(32), "reset-password", user.id, new Date(Date.now() + 60000));
    const result = await request(app).post(`${API}/password/change`).set("Authorization", `Bearer ${session}`).send({ currentPassword: password, password: password + "nowe" });
    expect(result.status).toBe(200);
    expect(await prisma.authToken.count({ where: { userId: user.id } })).toBe(0);
    expect((await request(app).get(`${API}/me`).set("Authorization", `Bearer ${session}`)).status).toBe(401);
    session = result.body.data.token;
    expect((await request(app).get(`${API}/me`).set("Authorization", `Bearer ${session}`)).status).toBe(200);
  });

  it("reset jest jednorazowy, nie ujawnia istnienia konta i uniewaznia sesje", async () => {
    const known = await request(app).post(`${API}/password/forgot`).send({ email, redirectTo });
    const token = lastToken();
    const missing = await request(app).post(`${API}/password/forgot`).send({ email: "local-auth-test-missing@example.com", redirectTo });
    expect(known.body).toEqual(missing.body);
    expect((await request(app).post(`${API}/password/reset`).send({ token, password })).status).toBe(200);
    expect((await request(app).post(`${API}/password/reset`).send({ token, password })).status).toBe(400);
    expect((await request(app).get(`${API}/me`).set("Authorization", `Bearer ${session}`)).status).toBe(401);
    expect((await request(app).post(`${API}/login`).send({ email, password })).status).toBe(200);
  });

  it("callback logowania bez state nie tworzy sesji", async () => {
    const calls = profile.mock.calls.length;
    const result = await request(app).get(`${API}/google/callback`).query({ code: "mock" });
    expect(result.status).toBe(400);
    expect(result.headers["set-cookie"]).toBeUndefined();
    expect(profile.mock.calls).toHaveLength(calls);
  });

  it("odrzuca wygasly token i token przeznaczony do innej operacji", async () => {
    const token = "ab".repeat(32);
    await authTokenRepository.create(token, "reset-password", user.id, new Date(Date.now() + 60000));
    expect((await request(app).post(`${API}/verify-email`).send({ token })).status).toBe(400);
    await prisma.authToken.updateMany({ where: { userId: user.id }, data: { expiresAt: new Date(0) } });
    expect((await request(app).post(`${API}/password/reset`).send({ token, password })).status).toBe(400);
  });

  it("ogranicza liczbe prob uwierzytelniania", async () => {
    const results = await Promise.all(Array.from({ length: 31 }, () => request(app).post(`${API}/login`).send({})));
    expect(results.some((result) => result.status === 429 && result.body.code === "AUTH_RATE_LIMITED")).toBe(true);
    expect((await request(app).post(`${API}/login`).send({ email, password })).status).toBe(429);
  });
});
