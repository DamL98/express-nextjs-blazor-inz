import { z } from "../../config/zod.js";
import { problemResponse } from "../documentation/documentation.schemas.js";

export function registerProblemsDocumentation(registry) {
  registry.registerPath({
    method: "get",
    path: "/problems/{slug}",
    tags: ["Dokumentacja"],
    summary: "Opis kodu błędu API",
    request: {
      params: z.object({ slug: z.string() })
    },
    responses: {
      200: {
        description: "Strona z definicją problemu",
        content: {
          "text/html": {
            schema: z.string()
          }
        }
      },
      404: problemResponse,
    },
  });
}
