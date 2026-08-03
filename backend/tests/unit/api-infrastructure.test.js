import { z } from "zod";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../../src/errors/apiError.js";
import { ApiErrorMapper } from "../../src/errors/apiErrorMapper.js";
import { NotFoundError } from "../../src/errors/httpErrors.js";
import { ValidationError } from "../../src/errors/validationError.js";
import { ApiResponse } from "../../src/utils/api-response.js";

function createResponseMock() {
  return {
    json: vi.fn(),
    status: vi.fn(),
    statusMessage: "",
  };
}

describe("ApiError", () => {
  it("buduje blad HTTP z kodem aplikacji i payloadem API", () => {
    const error = new NotFoundError("Nie znaleziono zasobu", "RESOURCE_NOT_FOUND");

    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(404);
    expect(error.statusMessage).toBe("Not Found");
    expect(error.toPayload()).toEqual({
      code: "RESOURCE_NOT_FOUND",
      message: "Nie znaleziono zasobu",
      details: null,
    });
  });

  it("mapuje ZodError na ValidationError ze szczegolami walidacji", () => {
    const result = z.object({ name: z.string().min(1) }).safeParse({ name: "" });
    const error = ApiErrorMapper.unknownErrorBuilder(result.error);

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details.fieldErrors.name).toBeDefined();
  });

  it("nie ujawnia szczegolow nieoczekiwanego bledu poza development", () => {
    const error = ApiErrorMapper.unknownErrorBuilder(new Error("sekret"));

    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_SERVER_ERROR");
    expect(error.details).toBeNull();
  });
});

describe("ApiResponse", () => {
  it("wysyla odpowiedz success przez Express response", () => {
    const res = createResponseMock();
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);

    ApiResponse.created({ id: "reservation-1" }).send(res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: "reservation-1" },
    });
  });

  it("wysyla odpowiedz error z HTTP statusMessage i dotychczasowym envelope", () => {
    const res = createResponseMock();
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    const error = new NotFoundError("Nie znaleziono zasobu", "RESOURCE_NOT_FOUND");

    ApiResponse.fromError(error).send(res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.statusMessage).toBe("Not Found");
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "Nie znaleziono zasobu",
        details: null,
      },
    });
  });
});
