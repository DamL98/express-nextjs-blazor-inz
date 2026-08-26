import { describe, expect, it, vi } from "vitest";

import { ApiResponse } from "../../src/utils/apiResponse.js";

describe("ApiResponse", () => {
  it("wysyla odpowiedz sukcesu przez Express", () => {
    const response = {
      json: vi.fn(),
      status: vi.fn(),
      type: vi.fn(),
    };
    response.status.mockReturnValue(response);
    response.type.mockReturnValue(response);

    ApiResponse.created({ id: "reservation-1" }).send(response);

    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      data: { id: "reservation-1" },
    });
  });
});
