import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { getOpenApiDocument } from "./documentation.controller.js";

const router = Router();

router.get("/openapi.json", getOpenApiDocument);
router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(null, {
  customSiteTitle: "Dokumentacja API rezerwacji sal",
  swaggerOptions: {
    url: "/openapi.json",
    validatorUrl: null,
    persistAuthorization: false,
    withCredentials: true,
    requestInterceptor: (request) => {
      // Pobranie specyfikacji może nie zawierać jawnie ustawionej metody HTTP.
      const requestMethod = (request.method ?? "GET").toUpperCase();

      // Puste operacje zapisu także używają JSON zgodnie z ochroną CSRF API.
      if (["POST", "PATCH", "PUT", "DELETE"].includes(requestMethod) && !request.body) {
        request.headers ??= {};
        request.headers["Content-Type"] = "application/json";
        request.body = "{}";
      }
      return request;
    },
  },
}));

export default router;
