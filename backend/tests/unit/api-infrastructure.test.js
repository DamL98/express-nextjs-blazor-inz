import { z } from "zod";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../../src/errors/apiError.js";
import { toApiError } from "../../src/errors/apiErrorMapper.js";
import { ProblemDefinitions } from "../../src/errors/problemDefinitions.js";
import { ApiResponse } from "../../src/utils/apiResponse.js";

function createResponseMock() {
  return {
    json: vi.fn(),
    status: vi.fn(),
    type: vi.fn(),
  };
}

describe("ApiError", () => {
  it("buduje ApiError zgodny z modelem Problem Details", () => {
    const error = ApiError.from(ProblemDefinitions.ROOM_NOT_FOUND);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.toProblemDetails("urn:uuid:test-instance")).toEqual({
      type: "/problems/room-not-found",
      title: "Nie znaleziono sali",
      status: 404,
      detail: "Nie znaleziono sali",
      instance: "urn:uuid:test-instance",
      code: "ROOM_NOT_FOUND",
    });
  });

  it("mapuje ZodError na ApiError z rozszerzeniem errors", () => {
    const result = z.object({ name: z.string().min(1) }).safeParse({ name: "" });
    const error = toApiError(result.error);
    const problem = error.toProblemDetails();

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(problem.errors.fieldErrors.name).toBeDefined();
  });

  it("nie ujawnia szczegolow nieoczekiwanego bledu poza development", () => {
    const error = toApiError(new Error("sekret"));
    const problem = error.toProblemDetails();

    expect(error.status).toBe(500);
    expect(error.code).toBe("INTERNAL_SERVER_ERROR");
    expect(problem).not.toHaveProperty("debug");
  });
});

describe("ApiResponse", () => {
  it("wysyla odpowiedz success przez Express response", () => {
    const res = createResponseMock();
    res.status.mockReturnValue(res);
    res.type.mockReturnValue(res);
    res.json.mockReturnValue(res);

    ApiResponse.created({ id: "reservation-1" }).send(res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: "reservation-1" },
    });
  });

  it("wysyla odpowiedz application/problem+json bez envelope", () => {
    const res = createResponseMock();
    res.status.mockReturnValue(res);
    res.type.mockReturnValue(res);
    res.json.mockReturnValue(res);
    const error = ApiError.from(ProblemDefinitions.ROOM_NOT_FOUND);

    ApiResponse.problem(error, "urn:uuid:test-instance").send(res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.type).toHaveBeenCalledWith("application/problem+json");
    expect(res.json).toHaveBeenCalledWith({
      type: "/problems/room-not-found",
      title: "Nie znaleziono sali",
      status: 404,
      detail: "Nie znaleziono sali",
      instance: "urn:uuid:test-instance",
      code: "ROOM_NOT_FOUND",
    });
  });
});
