import { z } from "../../config/zod.js";
import { successResponse } from "../documentation/documentation.schemas.js";

export function registerHealthDocumentation(registry) {
  for (const path of ["/health", "/api/v1/health"]) {
    registry.registerPath({
      method: "get",
      path,
      tags: ["Stan systemu"],
      summary: "Sprawdzenie działania API",
      responses: {
        200: successResponse(z.object({
          status: z.literal("ok"),
          service: z.literal("reservation-system-api"),
          timestamp: z.iso.datetime(),
        }))
      },
    });
  }
}
