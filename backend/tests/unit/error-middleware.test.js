import { z } from "zod";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../../src/errors/apiError.js";
import { Problems } from "../../src/errors/problems.js";
import { errorMiddleware } from "../../src/middlewares/error.middleware.js";

function response() {
  const res = { json: vi.fn(), status: vi.fn(), type: vi.fn() };
  res.status.mockReturnValue(res);
  res.type.mockReturnValue(res);
  return res;
}

describe("Obsługa błędów", () => {
  it("zwraca błąd walidacji", () => {
    const res = response();
    errorMiddleware(z.object({ name: z.string().min(1) }).safeParse({ name: "" }).error, null, res, null);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "VALIDATION_ERROR", status: 400 }));
  });

  it("zwraca zadeklarowany ApiError", () => {
    const res = response();
    errorMiddleware(new ApiError(Problems.ROOM_NOT_FOUND), null, res, null);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "ROOM_NOT_FOUND", status: 404 }));
  });

  it("ukrywa szczegóły nieoczekiwanego błędu", () => {
    const res = response();
    errorMiddleware(new Error("sekret"), null, res, null);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: "INTERNAL_SERVER_ERROR",
      detail: "Wystapil nieoczekiwany blad serwera",
    }));
    expect(JSON.stringify(res.json.mock.calls)).not.toContain("sekret");
  });
});
