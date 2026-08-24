import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

import { app } from "../../src/app.js";

const API = "/api/v1/rooms";
const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

let room;

beforeAll(async () => {
  const response = await request(app).get(API);
  room = response.body.data.find((item) => item.isActive);
});

describe("Rooms API", () => {
  it("zwraca liste aktywnych sal", async () => {
    const response = await request(app).get(`${API}?active=true`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data.every((item) => item.isActive)).toBe(true);
  });

  it("zwraca szczegoly sali", async () => {
    const response = await request(app).get(`${API}/${room.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(room.id);
  });

  it("zwraca dostepnosc sali", async () => {
    const response = await request(app).get(
      `${API}/${room.id}/availability?start=2035-01-01T10:00:00.000Z&end=2035-01-01T11:00:00.000Z`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data.roomId).toBe(room.id);
    expect(response.body.data.available).toBeTypeOf("boolean");
  });

  it("odrzuca nieprawidlowy filtr pojemnosci", async () => {
    const response = await request(app).get(`${API}?capacityMin=abc`);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("zwraca blad dla nieistniejacej sali", async () => {
    const response = await request(app).get(`${API}/${EMPTY_UUID}`);

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("ROOM_NOT_FOUND");
  });
});
