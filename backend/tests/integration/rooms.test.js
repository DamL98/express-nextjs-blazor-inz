import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../src/app.js";

describe("Rooms API", () => {
  it("GET /api/v1/rooms should return rooms list", async () => {
    const response = await request(app).get("/api/v1/rooms");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it("GET /api/v1/rooms?active=true zwraca dostępne sale", async () => {
    const response = await request(app).get("/api/v1/rooms?active=true");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    for (const room of response.body.data) {
      expect(room.isActive).toBe(true);
    }
  });

  it("GET /api/v1/rooms?capacityMin=10 zwraca sale z miejscami mininum 10", async () => {
    const response = await request(app).get("/api/v1/rooms?capacityMin=10");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    for (const room of response.body.data) {
      expect(room.capacity).toBeGreaterThanOrEqual(10);
    }
  });

  it("GET /api/v1/rooms?capacityMin=abc zwraca VALIDATION_ERROR", async () => {
    const response = await request(app).get("/api/v1/rooms?capacityMin=abc");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("GET /api/v1/rooms/:id zwraca pojedynczą sale", async () => {
    const roomsResponse = await request(app).get("/api/v1/rooms");
    const roomId = roomsResponse.body.data[0].id;

    const response = await request(app).get(`/api/v1/rooms/${roomId}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(roomId);
  });

  it("GET /api/v1/rooms/:id zwraca 404 dla nieistniejącej sali", async () => {
    const response = await request(app).get(
      "/api/v1/rooms/00000000-0000-0000-0000-000000000000",
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("ROOM_NOT_FOUND");
  });

  it("GET /api/v1/rooms/:id/availability zwraca dostępne terminy dla sali", async () => {
    const roomsResponse = await request(app).get("/api/v1/rooms");
    const roomId = roomsResponse.body.data[0].id;

    const response = await request(app).get(
      `/api/v1/rooms/${roomId}/availability?start=2030-01-01T10:00:00.000Z&end=2030-01-01T11:00:00.000Z`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.roomId).toBe(roomId);
    expect(typeof response.body.data.available).toBe("boolean");
    expect(Array.isArray(response.body.data.conflicts)).toBe(true);
  });

  it("GET /api/v1/rooms/:id/availability should reject invalid time range", async () => {
    const roomsResponse = await request(app).get("/api/v1/rooms");
    const roomId = roomsResponse.body.data[0].id;

    const response = await request(app).get(
      `/api/v1/rooms/${roomId}/availability?start=2030-01-01T11:00:00.000Z&end=2030-01-01T10:00:00.000Z`,
    );

    //console.log("INVALID TIME RANGE RESPONSE:", response.status, response.body);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("INVALID_TIME_RANGE");
  });
});