import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createSessionToken } from "../../src/config/auth.js";
import { prisma } from "../../src/config/prisma.js";
import { app } from "../../src/app.js";

const API = "/api/v1/reservations";
const TEST_TITLE = "reservation-test";
const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

function asUser(testRequest, token) {
  return testRequest.set("Authorization", `Bearer ${token}`);
}

let activeRoom;
let inactiveRoom;
let otherUser;
let testUser;
let testUserToken;

function slot(day) {
  return {
    startTime: `2035-01-${String(day).padStart(2, "0")}T10:00:00.000Z`,
    endTime: `2035-01-${String(day).padStart(2, "0")}T11:00:00.000Z`,
  };
}

function body(roomId, day, title) {
  return {
    roomId,
    title: `${TEST_TITLE} ${title}`,
    ...slot(day),
  };
}

async function createForeignReservation(day) {
  return prisma.reservation.create({
    data: {
      userId: otherUser.id,
      roomId: activeRoom.id,
      title: `${TEST_TITLE} foreign`,
      startTime: new Date(slot(day).startTime),
      endTime: new Date(slot(day).endTime),
    },
  });
}

async function cleanTestReservations() {
  await prisma.reservation.deleteMany({
    where: {
      title: {
        startsWith: TEST_TITLE,
      },
    },
  });
}

beforeAll(async () => {
  await cleanTestReservations();

  const roomsResponse = await request(app).get("/api/v1/rooms");
  const rooms = roomsResponse.body.data;

  activeRoom = rooms.find((room) => room.isActive);
  inactiveRoom = rooms.find((room) => !room.isActive);
  otherUser = await prisma.user.findUnique({
    where: {
      email: "admin@example.com",
    },
  });
  testUser = await prisma.user.findUnique({
    where: {
      email: "user@example.com",
    },
    include: {
      role: true,
    },
  });
  testUserToken = createSessionToken(testUser);
});

afterAll(async () => {
  await cleanTestReservations();
});

describe("Reservations API", () => {
  it("GET /api/v1/reservations/my zwraca liste rezerwacji mock usera", async () => {
    const response = await asUser(request(app).get(`${API}/my`), testUserToken);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("POST /api/v1/reservations tworzy nowa rezerwacje", async () => {
    const reservation = body(activeRoom.id, 2, "create");

    const response = await asUser(request(app).post(API), testUserToken).send(reservation);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.roomId).toBe(activeRoom.id);
    expect(response.body.data.title).toBe(reservation.title);
    expect(response.body.data.status).toBe("ACTIVE");
  });

  it("POST /api/v1/reservations zwraca INVALID_TIME_RANGE", async () => {
    const reservation = body(activeRoom.id, 3, "invalid range");

    const response = await asUser(request(app).post(API), testUserToken).send({
      ...reservation,
      endTime: reservation.startTime,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_TIME_RANGE");
  });

  it("POST /api/v1/reservations zwraca RESERVATION_IN_PAST", async () => {
    const response = await asUser(request(app).post(API), testUserToken).send({
      ...body(activeRoom.id, 4, "past"),
      startTime: "2020-01-01T10:00:00.000Z",
      endTime: "2020-01-01T11:00:00.000Z",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("RESERVATION_IN_PAST");
  });

  it("POST /api/v1/reservations zwraca ROOM_INACTIVE", async () => {
    const response = await asUser(request(app).post(API), testUserToken)
      .send(body(inactiveRoom.id, 5, "inactive room"));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("ROOM_INACTIVE");
  });

  it("POST /api/v1/reservations zwraca ROOM_ALREADY_RESERVED", async () => {
    const reservation = body(activeRoom.id, 6, "conflict");

    const firstResponse = await asUser(request(app).post(API), testUserToken).send(reservation);
    const secondResponse = await asUser(request(app).post(API), testUserToken).send({
      ...reservation,
      title: `${TEST_TITLE} conflict copy`,
    });

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.error.code).toBe("ROOM_ALREADY_RESERVED");
  });

  it("GET /api/v1/reservations/:id zwraca RESERVATION_NOT_FOUND", async () => {
    const foreignReservation = await createForeignReservation(7);

    const foreignResponse = await asUser(
      request(app).get(`${API}/${foreignReservation.id}`),
      testUserToken,
    );
    const missingResponse = await asUser(request(app).get(`${API}/${EMPTY_UUID}`), testUserToken);

    expect(foreignResponse.status).toBe(404);
    expect(foreignResponse.body.error.code).toBe("RESERVATION_NOT_FOUND");
    expect(missingResponse.status).toBe(404);
    expect(missingResponse.body.error.code).toBe("RESERVATION_NOT_FOUND");
  });

  it("PATCH /api/v1/reservations/:id/cancel ustawia status CANCELLED", async () => {
    const created = await asUser(request(app).post(API), testUserToken)
      .send(body(activeRoom.id, 8, "cancel"));

    const response = await asUser(
      request(app).patch(`${API}/${created.body.data.id}/cancel`),
      testUserToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("CANCELLED");
  });

  it("PATCH /api/v1/reservations/:id/cancel pozwala dwukrotnie anulowac", async () => {
    const created = await asUser(request(app).post(API), testUserToken)
      .send(body(activeRoom.id, 9, "cancel twice"));

    const firstResponse = await asUser(
      request(app).patch(`${API}/${created.body.data.id}/cancel`),
      testUserToken,
    );
    const secondResponse = await asUser(
      request(app).patch(`${API}/${created.body.data.id}/cancel`),
      testUserToken,
    );

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.data.status).toBe("CANCELLED");
  });
});
