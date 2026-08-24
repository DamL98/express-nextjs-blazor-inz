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

const API = "/api/v1/reservations";
const TEST_TITLE = "reservation-test";
const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

let activeRoom;
let otherUser;
let testUserToken;

function reservationBody(day, title) {
  return {
    roomId: activeRoom.id,
    title: `${TEST_TITLE} ${title}`,
    ...reservationSlot(day),
  };
}

beforeAll(async () => {
  await removeReservations(TEST_TITLE);

  activeRoom = await prisma.room.findFirst({ where: { isActive: true } });
  otherUser = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
  });
  ({ token: testUserToken } = await getUserSession("user@example.com"));
});

afterAll(async () => {
  await removeReservations(TEST_TITLE);
});

describe("Reservations API", () => {
  it("tworzy rezerwacje i zwraca ja na liscie uzytkownika", async () => {
    const createResponse = await authorize(request(app).post(API), testUserToken)
      .send(reservationBody(2, "create"));
    const listResponse = await authorize(
      request(app).get(`${API}/my`),
      testUserToken,
    );

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.status).toBe("ACTIVE");
    expect(listResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: createResponse.body.data.id }),
      ]),
    );
  });

  it("odrzuca nieprawidlowy przedzial czasu", async () => {
    const body = reservationBody(3, "invalid-range");
    const response = await authorize(request(app).post(API), testUserToken)
      .send({ ...body, endTime: body.startTime });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_TIME_RANGE");
  });

  it("odrzuca termin zajety przez inna rezerwacje", async () => {
    const body = reservationBody(4, "conflict");

    await authorize(request(app).post(API), testUserToken).send(body);
    const response = await authorize(request(app).post(API), testUserToken)
      .send({ ...body, title: `${TEST_TITLE} conflict-copy` });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("ROOM_ALREADY_RESERVED");
  });

  it("nie ujawnia rezerwacji innego uzytkownika", async () => {
    const slot = reservationSlot(5);
    const foreignReservation = await prisma.reservation.create({
      data: {
        userId: otherUser.id,
        roomId: activeRoom.id,
        title: `${TEST_TITLE} foreign`,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime),
      },
    });

    const response = await authorize(
      request(app).get(`${API}/${foreignReservation.id}`),
      testUserToken,
    );

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("RESERVATION_NOT_FOUND");
  });

  it("anuluje rezerwacje uzytkownika", async () => {
    const created = await authorize(request(app).post(API), testUserToken)
      .send(reservationBody(6, "cancel"));
    const response = await authorize(
      request(app).patch(`${API}/${created.body.data.id}/cancel`),
      testUserToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("CANCELLED");
  });

  it("zwraca blad dla nieistniejacej rezerwacji", async () => {
    const response = await authorize(
      request(app).get(`${API}/${EMPTY_UUID}`),
      testUserToken,
    );

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("RESERVATION_NOT_FOUND");
  });
});
