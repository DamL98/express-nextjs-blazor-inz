import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { verifyIdTokenMock } = vi.hoisted(() => ({
  verifyIdTokenMock: vi.fn(async (token) =>
    token === "admin-token"
      ? {
          uid: "test-firebase-admin",
          email: "admin@example.com",
          name: "Administrator Systemu",
          email_verified: true,
        }
      : {
          uid: "test-firebase-user",
          email: "user@example.com",
          name: "Jan Kowalski",
          email_verified: true,
        },
  ),
}));

vi.mock("../../src/config/firebase.js", () => ({
  getFirebaseAuth: () => ({ verifyIdToken: verifyIdTokenMock }),
}));

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
    const ownReservation = await request(app)
      .post("/api/v1/reservations")
      .set("Authorization", "Bearer user-token")
      .send({
        roomId: activeRoom.id,
        title: `${TEST_TITLE} own`,
        ...slot(1),
      });
    const adminReservation = await createAdminReservation(2, "admin");

    const response = await request(app)
      .get("/api/v1/admin/reservations")
      .set("Authorization", "Bearer admin-token");
    const ids = response.body.data.map((reservation) => reservation.id);

    expect(response.status).toBe(200);
    expect(ids).toContain(ownReservation.body.data.id);
    expect(ids).toContain(adminReservation.id);
  });

  it("PATCH /api/v1/admin/reservations/:id/cancel anuluje czyjąś rezerwacje", async () => {
    const reservation = await createAdminReservation(3, "cancel");

    const response = await request(app)
      .patch(`/api/v1/admin/reservations/${reservation.id}/cancel`)
      .set("Authorization", "Bearer admin-token");

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("CANCELLED");
  });

  it("PATCH /api/v1/admin/reservations/:id/cancel zwraca RESERVATION_NOT_FOUND", async () => {
    const response = await request(app)
      .patch(`/api/v1/admin/reservations/${EMPTY_UUID}/cancel`)
      .set("Authorization", "Bearer admin-token");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("RESERVATION_NOT_FOUND");
  });

  it("GET /api/v1/admin/reservations odrzuca zwykłego użytkownika", async () => {
    const response = await request(app)
      .get("/api/v1/admin/reservations")
      .set("Authorization", "Bearer user-token");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });
});
