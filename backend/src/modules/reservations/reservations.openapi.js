import { z } from "../../config/zod.js";
import { getReservationsQuerySchema, reservationIdParamsSchema, createReservationBodySchema } from "./reservations.validation.js";
import { reservationResponseSchema, successResponse, jsonRequestBody, sessionSecurity, problemResponse } from "../documentation/documentation.schemas.js";

export function registerReservationsDocumentation(registry) {
  const operations = [
    ["get", "/my", "Lista moich rezerwacji", { query: getReservationsQuerySchema }, z.array(reservationResponseSchema)],
    ["get", "/{id}", "Szczegóły mojej rezerwacji", { params: reservationIdParamsSchema }, reservationResponseSchema],
    ["post", "", "Utworzenie rezerwacji", { body: jsonRequestBody(createReservationBodySchema) }, reservationResponseSchema],
    ["patch", "/{id}/cancel", "Anulowanie mojej rezerwacji", { params: reservationIdParamsSchema }, reservationResponseSchema],
  ];

  for (const [method, path, summary, request, responseSchema] of operations) {
    registry.registerPath({
      method,
      path: `/api/v1/reservations${path}`,
      tags: ["Rezerwacje"],
      summary,
      security: sessionSecurity,
      request,
      responses: {
        [method === "post" ? 201 : 200]: successResponse(responseSchema),
        default: problemResponse },
    });
  }
}
