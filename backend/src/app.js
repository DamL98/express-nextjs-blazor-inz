import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// import endpointow
import roomsRoutes from "./modules/rooms/rooms.routes.js";

// import funkcji
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { successResponse } from "./utils/api-response.js";


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
  return successResponse(res, {
    status: "ok",
    service: "reservation-system-api",
    timestamp: new Date().toISOString(),
  });
}

// routes start
app.get("/api/v1/health", healthHandler);


// routes -> rooms
app.use("/api/v1/rooms", roomsRoutes);





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
