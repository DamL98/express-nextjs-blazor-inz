import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { app } from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";

const TEST_TITLE = "admin-reservation-test";
const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

let activeRoom;
let adminUser;

function slot(day) {
  return {
    startTime: `2035-02-${String(day).padStart(2, "0")}T10:00:00.000Z`,
    endTime: `2035-02-${String(day).padStart(2, "0")}T11:00:00.000Z`,
  };
}

async function createAdminReservation(day, title) {
  return prisma.reservation.create({
    data: {
      userId: adminUser.id,
      roomId: activeRoom.id,
      title: `${TEST_TITLE} ${title}`,
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
  adminUser = await prisma.user.findUnique({
    where: {
      email: "admin@example.com",
    },
  });
});

afterAll(async () => {
  await cleanTestReservations();
});

describe("Admin reservations API", () => {
  it("GET /api/v1/admin/reservations zwraca rezerwacje wszystkich uzytkownikow", async () => {
    const ownReservation = await request(app).post("/api/v1/reservations").send({
      roomId: activeRoom.id,
      title: `${TEST_TITLE} own`,
      ...slot(1),
    });
    const adminReservation = await createAdminReservation(2, "admin");

    const response = await request(app).get("/api/v1/admin/reservations");
    const ids = response.body.data.map((reservation) => reservation.id);

    expect(response.status).toBe(200);
    expect(ids).toContain(ownReservation.body.data.id);
    expect(ids).toContain(adminReservation.id);
  });

  it("PATCH /api/v1/admin/reservations/:id/cancel anuluje czyjąś rezerwacje", async () => {
    const reservation = await createAdminReservation(3, "cancel");

    const response = await request(app).patch(
      `/api/v1/admin/reservations/${reservation.id}/cancel`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("CANCELLED");
  });

  it("PATCH /api/v1/admin/reservations/:id/cancel zwraca RESERVATION_NOT_FOUND", async () => {
    const response = await request(app).patch(
      `/api/v1/admin/reservations/${EMPTY_UUID}/cancel`,
    );

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("RESERVATION_NOT_FOUND");
  });
});
