import { z } from "../../config/zod.js";
import { getAdminReservationsQuerySchema, adminReservationIdParamsSchema } from "./admin.validation.js";
import { reservationResponseSchema, successResponse, sessionSecurity, problemResponse } from "../documentation/documentation.schemas.js";

export function registerAdminDocumentation(registry) {
  registry.registerPath({
    method: "get",
    path: "/api/v1/admin/reservations",
    tags: ["Administracja"],
    summary: "Lista wszystkich rezerwacji",
    description: "Wymagana rola admin.",
    security: sessionSecurity,
    request: {
      query: getAdminReservationsQuerySchema
    },
    responses: {
      200: successResponse(z.array(reservationResponseSchema)),
      default: problemResponse
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/v1/admin/reservations/{id}/cancel",
    tags: ["Administracja"],
    summary: "Anulowanie dowolnej rezerwacji",
    description: "Wymagana rola admin.",
    security: sessionSecurity,
    request: {
      params: adminReservationIdParamsSchema
    },
    responses: {
      200: successResponse(reservationResponseSchema),
      default: problemResponse
    },
  });
}
