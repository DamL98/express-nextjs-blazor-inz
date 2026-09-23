import { z } from "../../config/zod.js";
import { googleCalendarConnectQuerySchema } from "./google-calendar.validation.js";
import { successResponse, sessionSecurity, problemResponse, redirectResponse, oauthCallbackQuerySchema } from "../documentation/documentation.schemas.js";

export function registerGoogleCalendarDocumentation(registry) {
  registry.registerPath({
    method: "get",
    path: "/api/v1/google-calendar/status",
    tags: ["Google Calendar"],
    summary: "Stan połączenia kalendarza",
    security: sessionSecurity,
    responses: { 200: successResponse(z.object({
      connected: z.boolean(),
      provider: z.string().nullable(),
      calendarEmail: z.string().nullable(),
      connectedAt: z.iso.datetime().nullable(),
      tokenExpiresAt: z.iso.datetime().nullable(),
      syncEnabled: z.boolean(),
    })), default: problemResponse },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/google-calendar/connect/start",
    tags: ["Google Calendar"],
    summary: "Rozpoczęcie integracji kalendarza",
    security: sessionSecurity,
    request: {
      query: googleCalendarConnectQuerySchema
    },
    responses: {
      302: redirectResponse,
      default: problemResponse
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/google-calendar/connect/callback",
    tags: ["Google Calendar"],
    summary: "Callback integracji kalendarza",
    request: {
      query: oauthCallbackQuerySchema
    },
    responses: {
      302: redirectResponse,
      default: problemResponse
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/v1/google-calendar/connection",
    tags: ["Google Calendar"],
    summary: "Odłączenie kalendarza",
    security: sessionSecurity,
    responses: {
      200: successResponse(z.object({ disconnected: z.boolean() })),
      default: problemResponse
    },
  });
}
