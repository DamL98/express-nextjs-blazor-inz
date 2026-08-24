import { z, ZodError } from "zod";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../../src/errors/apiError.js";
import { Problems } from "../../src/errors/problems.js";
import { errorMiddleware } from "../../src/middlewares/error.middleware.js";

function createResponse() {
  const response = {
    json: vi.fn(),
    status: vi.fn(),
    type: vi.fn(),
  };

  response.json.mockReturnValue(response);
  response.status.mockReturnValue(response);
  response.type.mockReturnValue(response);

  return response;
}

describe("errorMiddleware", () => {
  it("obsluguje ZodError jako blad walidacji", () => {
    const result = z.object({ name: z.string().min(1) }).safeParse({ name: "" });
    const response = createResponse();

    expect(result.error).toBeInstanceOf(ZodError);

    errorMiddleware(result.error, null, response, null);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.type).toHaveBeenCalledWith("application/problem+json");
    expect(response.json.mock.calls[0][0]).toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
    });
  });

  it("wysyla kontrolowany ApiError", () => {
    const response = createResponse();

    errorMiddleware(
      new ApiError(Problems.ROOM_NOT_FOUND),
      null,
      response,
      null,
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.type).toHaveBeenCalledWith("application/problem+json");
    expect(response.json.mock.calls[0][0]).toMatchObject({
      type: "/problems/room-not-found",
      code: "ROOM_NOT_FOUND",
    });
  });

  it("nie ujawnia szczegolow unexpected error", () => {
    const response = createResponse();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    errorMiddleware(new Error("sekret"), null, response, null);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json.mock.calls[0][0]).toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      detail: "Wystapil nieoczekiwany blad serwera",
    });
    expect(response.json.mock.calls[0][0]).not.toHaveProperty("debug");

    consoleError.mockRestore();
  });
});
