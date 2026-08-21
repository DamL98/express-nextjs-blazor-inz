import { z, ZodError } from "zod";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../../src/errors/apiError.js";
import { Problems } from "../../src/errors/problems.js";
import { errorMiddleware } from "../../src/middlewares/error.middleware.js";
import { ApiResponse } from "../../src/utils/apiResponse.js";

function createResponseMock() {
  const res = {
    json: vi.fn(),
    status: vi.fn(),
    type: vi.fn(),
  };

  res.status.mockReturnValue(res);
  res.type.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res;
}

describe("ApiError", () => {
  it("ma kompletne definicje typów problemów", () => {
    for (const problem of Object.values(Problems)) {
      expect(problem.type).toBe(
        `/problems/${problem.code.toLowerCase().replaceAll("_", "-")}`,
      );
      expect(problem.title).not.toBe("");
      expect(problem.status).toBeGreaterThanOrEqual(400);
      expect(problem.status).toBeLessThan(600);
    }
  });

  it("buduje odpowiedź zgodną z Problem Details", () => {
    const error = new ApiError(Problems.ROOM_NOT_FOUND);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.toProblemDetails("urn:uuid:test-instance")).toEqual({
      type: "/problems/room-not-found",
      title: "Nie znaleziono sali",
      status: 404,
      detail: "Nie znaleziono sali",
      instance: "urn:uuid:test-instance",
      code: "ROOM_NOT_FOUND",
    });
  });
});

describe("errorMiddleware", () => {
  it("obsługuje ZodError bez zamiany na ApiError", () => {
    const result = z.object({ name: z.string().min(1) }).safeParse({ name: "" });
    const res = createResponseMock();

    expect(result.error).toBeInstanceOf(ZodError);

    errorMiddleware(result.error, null, res, null);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.type).toHaveBeenCalledWith("application/problem+json");
    expect(res.json.mock.calls[0][0]).toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
    });
    expect(res.json.mock.calls[0][0].errors.properties.name.errors).toBeDefined();
  });

  it("nie ujawnia szczegółów nieoczekiwanego błędu", () => {
    const res = createResponseMock();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    errorMiddleware(new Error("sekret"), null, res, null);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      detail: "Wystapil nieoczekiwany blad serwera",
    });
    expect(res.json.mock.calls[0][0]).not.toHaveProperty("debug");

    consoleError.mockRestore();
  });

  it("wysyła kontrolowany ApiError jako application/problem+json", () => {
    const res = createResponseMock();
    const error = new ApiError(Problems.ROOM_NOT_FOUND);

    errorMiddleware(error, null, res, null);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.type).toHaveBeenCalledWith("application/problem+json");
    expect(res.json.mock.calls[0][0]).toMatchObject({
      type: "/problems/room-not-found",
      title: "Nie znaleziono sali",
      status: 404,
      detail: "Nie znaleziono sali",
      code: "ROOM_NOT_FOUND",
    });
  });
});

describe("ApiResponse", () => {
  it("wysyła odpowiedź success przez Express response", () => {
    const res = createResponseMock();

    ApiResponse.created({ id: "reservation-1" }).send(res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: "reservation-1" },
    });
  });
});
