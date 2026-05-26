import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// routes
import roomsRoutes from "./modules/rooms/rooms.routes.js";

// middlewares
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";

// utils
import { successResponse } from "./utils/api-response.js";

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
  return res.status(200).json(
    successResponse({
      status: "ok",
      service: "reservation-system-api",
      timestamp: new Date().toISOString(),
    }),
  );
}

app.get("/health", healthHandler);
app.get("/api/v1/health", healthHandler);

app.use("/api/v1/rooms", roomsRoutes);

// 404 musi być po trasach
app.use(notFoundMiddleware);

// error middleware musi być ostatni
app.use(errorMiddleware);