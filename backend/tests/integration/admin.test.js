import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { app } from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";
import {
  authorize,
  getUserSession,
  removeReservations,
  reservationSlot,
} from "../support/integration.js";

const API = "/api/v1/admin/reservations";
const TEST_TITLE = "admin-api-test";

let activeRoom;
let adminToken;
let user;
let userToken;

beforeAll(async () => {
  await removeReservations(TEST_TITLE);

  activeRoom = await prisma.room.findFirst({ where: { isActive: true } });
  ({ token: adminToken } = await getUserSession("admin@example.com"));
  ({ user, token: userToken } = await getUserSession("user@example.com"));
});

afterAll(async () => {
  await removeReservations(TEST_TITLE);
});

describe("Admin reservations API", () => {
  it("pozwala administratorowi odczytac rezerwacje", async () => {
    const slot = reservationSlot(1, "02");
    const reservation = await prisma.reservation.create({
      data: {
        userId: user.id,
        roomId: activeRoom.id,
        title: `${TEST_TITLE} visible`,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime),
      },
    });

    const response = await authorize(request(app).get(API), adminToken);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: reservation.id }),
      ]),
    );
  });

  it("odrzuca zwyklego uzytkownika", async () => {
    const response = await authorize(request(app).get(API), userToken);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("FORBIDDEN");
  });
});
