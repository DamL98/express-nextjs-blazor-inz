import { z } from "../../config/zod.js";
import { reservationResponseSchema, successResponse, sessionSecurity, problemResponse } from "../documentation/documentation.schemas.js";

export function registerDashboardDocumentation(registry) {
  registry.registerPath({
    method: "get",
    path: "/api/v1/dashboard",
    tags: ["Przegląd"],
    summary: "Podsumowanie i najbliższe rezerwacje",
    security: sessionSecurity,
    responses: { 200: successResponse(z.object({
      activeRoomsCount: z.number().int(),
      nextReservations: z.array(reservationResponseSchema),
    })),
    default: problemResponse },
  });
}
