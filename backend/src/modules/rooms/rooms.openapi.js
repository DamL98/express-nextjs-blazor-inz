import { z } from "../../config/zod.js";
import { getRoomsQuerySchema, roomIdParamsSchema, roomAvailabilityQuerySchema } from "./rooms.validation.js";
import { roomResponseSchema, successResponse, problemResponse } from "../documentation/documentation.schemas.js";

export function registerRoomsDocumentation(registry) {
  registry.registerPath({
    method: "get",
    path: "/api/v1/rooms",
    tags: ["Sale"],
    summary: "Lista sal",
    description: "capacityMin jest parametrem tekstowym przeliczanym na dodatnią liczbę całkowitą. Pusta wartość pomija filtr.",
    request: {
      query: getRoomsQuerySchema
    },
    responses: {
      200: successResponse(z.array(roomResponseSchema)),
      default: problemResponse
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/rooms/{id}",
    tags: ["Sale"],
    summary: "Szczegóły sali",
    request: {
      params: roomIdParamsSchema
    },
    responses: {
      200: successResponse(roomResponseSchema),
      default: problemResponse
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/rooms/{id}/availability",
    tags: ["Sale"],
    summary: "Sprawdzenie konfliktów terminów",
    request: {
      params: roomIdParamsSchema,
      query: roomAvailabilityQuerySchema
    },
    responses: {
      200: successResponse(z.object({
        roomId: z.uuid(),
        available: z.boolean(),
        start: z.iso.datetime(),
        end: z.iso.datetime(),
        conflicts: z.array(z.object({
          id: z.uuid(),
          title: z.string(),
          startTime: z.iso.datetime(),
          endTime: z.iso.datetime()
        })),
    })), default: problemResponse
  },
  });
}
