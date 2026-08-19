import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// routes
import adminRoutes from "./modules/admin/admin.routes.js";
import roomsRoutes from "./modules/rooms/rooms.routes.js";
import reservationsRoutes from "./modules/reservations/reservations.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import googleCalendarRoutes from "./modules/google-calendar/google-calendar.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";

// middlewares
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";

// utils
import { ApiResponse } from "./utils/apiResponse.js";
import { findProblemByType } from "./errors/problemDefinitions.js";

export const app = express();

app.use(
  cors({
    origin: [
      process.env.FRONTEND_NEXT_URL || "http://localhost:3000",
      process.env.FRONTEND_BLAZOR_URL || "http://localhost:5173",
    ],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

function healthHandler(_req, res) {
  return ApiResponse.ok({
    status: "ok",
    service: "reservation-system-api",
    timestamp: new Date().toISOString(),
  }).send(res);
}

app.get("/health", healthHandler);
app.get("/api/v1/health", healthHandler);

app.get("/problems/:slug", (req, res, next) => {
  const definition = findProblemByType(
    `/problems/${req.params.slug}`,
  );

  if (!definition) {
    return next();
  }

  return res
    .type("html")
    .send(`<!doctype html>
<html lang="pl">
<head><meta charset="utf-8"><title>${definition.title}</title></head>
<body>
  <main>
    <h1>${definition.title}</h1>
    <dl>
      <dt>Type</dt><dd><code>${definition.type}</code></dd>
      <dt>HTTP status</dt><dd>${definition.status}</dd>
      <dt>Code</dt><dd><code>${definition.code}</code></dd>
      <dt>Default detail</dt><dd>${definition.detail}</dd>
    </dl>
  </main>
</body>
</html>`);
});

app.use("/api/v1/rooms", roomsRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/google-calendar", googleCalendarRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/reservations", reservationsRoutes)
app.use("/api/v1/admin", adminRoutes)


// middleware
app.use(notFoundMiddleware);
app.use(errorMiddleware);
