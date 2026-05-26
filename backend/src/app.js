import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { prisma } from "./config/prisma.js";

export const app = express();

// app use
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173"
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
// end app use


// test route /health
function healthHandler(_req, res) {
  return res.status(200).json({
    success: true,
    data: {
      status: "ok",
      service: "reservation-system-api",
      timestamp: new Date().toISOString(),
    },
  });
}



// routes start
app.get("/api/v1/health", healthHandler);

app.get("/api/v1/rooms", async (_req, res, next) => {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
});
//////////////////////////////////////////////////////////////




// route error
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: {
      code: "brak wskazanego route",
      message: `endpoint ${req.method} ${req.originalUrl} nie istnieje`,
    },
  });
});
//////////////////////////////////////////////////////////////
