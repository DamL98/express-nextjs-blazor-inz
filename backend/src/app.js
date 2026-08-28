import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { getApplicationEnvironment } from "./config/environment.js";

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
import problemsRoutes from "./errors/problems.routes.js";

// utils
import { ApiResponse } from "./utils/apiResponse.js";

export const app = express();
const environment = getApplicationEnvironment();

app.use(
  cors({
    origin: [
      environment.frontendNextUrl,
      environment.frontendBlazorUrl,
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

// view html z definicja erroru api
app.use("/problems", problemsRoutes);

app.use("/api/v1/rooms", roomsRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/google-calendar", googleCalendarRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/reservations", reservationsRoutes)
app.use("/api/v1/admin", adminRoutes)


// middleware
app.use(notFoundMiddleware);
app.use(errorMiddleware);
