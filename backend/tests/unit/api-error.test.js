import { describe, expect, it } from "vitest";

import { ApiError } from "../../src/errors/apiError.js";
import { Problems } from "../../src/errors/problems.js";

describe("ApiError", () => {
  it("ma kompletne definicje problemow", () => {
    for (const problem of Object.values(Problems)) {
      expect(problem.type).toBe(
        `/problems/${problem.code.toLowerCase().replaceAll("_", "-")}`,
      );
      expect(problem.title).not.toBe("");
      expect(problem.status).toBeGreaterThanOrEqual(400);
      expect(problem.status).toBeLessThan(600);
    }
  });

  it("buduje odpowiedz Problem Details", () => {
    const error = new ApiError(Problems.ROOM_NOT_FOUND);

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
