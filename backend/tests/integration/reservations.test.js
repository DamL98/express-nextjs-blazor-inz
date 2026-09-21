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
  it("odrzuca czas krotszy niz 10 minut i akceptuje dokladnie 10 minut", async () => {
    const body = reservationBody(7, "minimum-duration");
    const start = new Date(body.startTime).getTime();
    const tooShort = await authorize(request(app).post(API), testUserToken)
      .send({ ...body, endTime: new Date(start + 600000 - 1).toISOString() });
    expect(tooShort.status).toBe(400);
    expect(tooShort.body.code).toBe("RESERVATION_TOO_SHORT");
    const valid = await authorize(request(app).post(API), testUserToken)
      .send({ ...body, endTime: new Date(start + 600000).toISOString() });
    expect(valid.status).toBe(201);
  });

  it("zapisuje tylko jedna z rownoczesnych rezerwacji tej samej sali", async () => {
    const body = reservationBody(8, "concurrent");
    const responses = await Promise.all(Array.from({ length: 5 }, () =>
      authorize(request(app).post(API), testUserToken).send(body),
    ));
    expect(responses.filter((response) => response.status === 201)).toHaveLength(1);
    const conflicts = responses.filter((response) => response.status === 409);
    expect(conflicts).toHaveLength(4);
    for (const response of conflicts) {
      expect(response.body.code).toBe("ROOM_ALREADY_RESERVED");
    }
    expect(await prisma.reservation.count({ where: { title: body.title } })).toBe(1);
  });

  it("odrzuca czesciowe nakladanie i dopuszcza terminy stykajace sie", async () => {
    const body = reservationBody(9, "boundaries");
    const created = await authorize(request(app).post(API), testUserToken).send(body);
    expect(created.status).toBe(201);
    const overlap = await authorize(request(app).post(API), testUserToken).send({
      ...body, startTime: "2035-01-09T10:30:00.000Z", endTime: "2035-01-09T11:30:00.000Z",
    });
    expect(overlap.status).toBe(409);
    const adjacent = await authorize(request(app).post(API), testUserToken).send({
      ...body, startTime: body.endTime, endTime: "2035-01-09T12:00:00.000Z",
    });
    expect(adjacent.status).toBe(201);
  });

  it("po anulowaniu pozwala ponownie zajac ten sam termin", async () => {
    const body = reservationBody(10, "reuse-cancelled");
    const created = await authorize(request(app).post(API), testUserToken).send(body);
    expect(created.status).toBe(201);
    const cancelled = await authorize(
      request(app).patch(`${API}/${created.body.data.id}/cancel`), testUserToken,
    );
    expect(cancelled.status).toBe(200);
    const recreated = await authorize(request(app).post(API), testUserToken).send(body);
    expect(recreated.status).toBe(201);
  });

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
