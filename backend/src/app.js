import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { getApplicationEnvironment } from "./config/environment.js";

// Trasy aplikacji
import documentationRoutes from "./modules/documentation/documentation.routes.js";
import healthRoutes from "./modules/health/health.routes.js";
import measurementRoutes from "./modules/measurement/measurement.routes.js";
import problemsRoutes from "./modules/problems/problems.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import roomsRoutes from "./modules/rooms/rooms.routes.js";
import reservationsRoutes from "./modules/reservations/reservations.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import googleCalendarRoutes from "./modules/google-calendar/google-calendar.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";

// Middleware aplikacji
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { csrfProtection } from "./middlewares/csrf.middleware.js";

export const app = express();
const environment = getApplicationEnvironment();

app.use(
  cors({
    origin: [
      environment.frontendNextUrl,
      environment.frontendBlazorUrl,
    ],
    credentials: true,
    exposedHeaders: ["Retry-After", "RateLimit", "RateLimit-Policy"],
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use(csrfProtection);
app.use(documentationRoutes);

app.use("/health", healthRoutes);
app.use("/api/v1/health", healthRoutes);
app.use("/measurement-info", measurementRoutes);
app.use("/problems", problemsRoutes);

app.use("/api/v1/rooms", roomsRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/google-calendar", googleCalendarRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/reservations", reservationsRoutes);
app.use("/api/v1/admin", adminRoutes);

// Obsługa nieznanych tras i błędów
app.use(notFoundMiddleware);
app.use(errorMiddleware);
