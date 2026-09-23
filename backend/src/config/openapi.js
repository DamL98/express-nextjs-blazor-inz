import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { getAuthEnvironment } from "./environment.js";
import { registerAuthDocumentation } from "../modules/auth/auth.openapi.js";
import { registerRoomsDocumentation } from "../modules/rooms/rooms.openapi.js";
import { registerReservationsDocumentation } from "../modules/reservations/reservations.openapi.js";
import { registerAdminDocumentation } from "../modules/admin/admin.openapi.js";
import { registerDashboardDocumentation } from "../modules/dashboard/dashboard.openapi.js";
import { registerGoogleCalendarDocumentation } from "../modules/google-calendar/google-calendar.openapi.js";
import { registerHealthDocumentation } from "../modules/health/health.openapi.js";
import { registerMeasurementDocumentation } from "../modules/measurement/measurement.openapi.js";
import { registerProblemsDocumentation } from "../modules/problems/problems.openapi.js";
import { roomResponseSchema, reservationResponseSchema, userResponseSchema } from "../modules/documentation/documentation.schemas.js";

export function createOpenApiDocument() {
  const registry = new OpenAPIRegistry();

  registry.registerComponent(
    "securitySchemes",
    "bearerAuth", {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "Token sesji aplikacji otrzymany po zalogowaniu",
    }
  );

  registry.registerComponent(
    "securitySchemes",
    "cookieAuth", {
      type: "apiKey",
      in: "cookie",
      name: getAuthEnvironment().cookieName || "session",
      description: "Cookie HttpOnly ustawiane przez API",
    }
  );

  registry.register("Room", roomResponseSchema);
  registry.register("Reservation", reservationResponseSchema);
  registry.register("User", userResponseSchema);

  // każdy moduł ma swoje definicje openapi w module
  for (const registerDocumentation of [
    registerAuthDocumentation, registerRoomsDocumentation, registerReservationsDocumentation,
    registerAdminDocumentation, registerDashboardDocumentation, registerGoogleCalendarDocumentation,
    registerHealthDocumentation, registerMeasurementDocumentation, registerProblemsDocumentation,
  ]) {
    registerDocumentation(registry);
  }

  registry.registerPath({
    method: "get",
    path: "/openapi.json",
    tags: ["Dokumentacja"],
    summary: "Specyfikacja OpenAPI",
    responses: {
      200: {
        description: "Dokument OpenAPI 3.1",
        content: {
          "application/json": {
            schema: {
              type: "object",
              additionalProperties: true
            }
          }
        }
      }
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api-docs/",
    tags: ["Dokumentacja"],
    summary: "Interaktywna dokumentacja Swagger UI",
    responses: {
      200: {
        description: "Gotowy interfejs dokumentacji",
        content: {
          "text/html": {
            schema: {
              type: "string"
            }
          }
        }
      }
    },
  });

  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "System rezerwacji — API", version: "1.0.0",
      description: "Api desc",
    },
    servers: [
      { url: "/", description: "Backend Express.js" }
    ],
  });
}
