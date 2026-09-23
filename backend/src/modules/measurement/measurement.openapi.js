import { z } from "../../config/zod.js";
import { getRateLimitConfiguration } from "../../config/rate-limit.js";

export function registerMeasurementDocumentation(registry) {
  if (!getRateLimitConfiguration().isMeasurementModeEnabled) return;

  registry.registerPath({
    method: "get",
    path: "/measurement-info",
    tags: ["Stan systemu"],
    summary: "Konfiguracja uruchomionej instancji pomiarowej",
    responses: { 200: {
      description: "Metadane wykorzystywane przez runner pomiarów",
      content: {
        "application/json": {
          schema: z.object({
            production: z.boolean(),
            isolated: z.boolean(),
            rateLimitEnabled: z.boolean(),
          })
        }
      },
    }
  },
  });
}
