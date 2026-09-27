import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { app } from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";
import { authorize, getUserSession, removeReservations, reservationSlot } from "../support/integration.js";

// supertest - tworzy sztuczne żądanie http do API / .request/.post...
// beforeAll odpala sie Raz przed wszystkimi testami
// afterAll Raz po wszystkich testach

const API = "/api/v1/reservations";
const titlePrefix = "reservation-smoke";
let room;
let token;

const body = (day, title) => ({
  roomId: room.id,
  title: `${titlePrefix} ${title}`,
  ...reservationSlot(day),
});

beforeAll(async () => {
  await removeReservations(titlePrefix);
  room = await prisma.room.findFirst({ where: { isActive: true } });
  ({ token } = await getUserSession("user@example.com"));
});

afterAll(() => removeReservations(titlePrefix));

describe("Reservations API", () => {
  it("tworzy i anuluje wlasna rezerwacje", async () => {
    const created = await authorize(request(app).post(API), token)
      .send(body(2, "lifecycle"));
    const cancelled = await authorize(request(app).patch(`${API}/${created.body.data.id}/cancel`), token);

    expect(created).toMatchObject({ status: 201, body: { data: { status: "ACTIVE" } } });
    expect(cancelled).toMatchObject({ status: 200, body: { data: { status: "CANCELLED" } } });
  });

  it("odrzuca drugi termin w tej samej sali", async () => {
    const reservation = body(3, "conflict");
    await authorize(request(app).post(API), token)
      .send(reservation);

    const conflict = await authorize(request(app).post(API), token)
      .send({ ...reservation, title: `${titlePrefix} duplicate` });

    expect(conflict).toMatchObject({ status: 409, body: { code: "ROOM_ALREADY_RESERVED" } });
  });
});
