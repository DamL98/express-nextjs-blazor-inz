import { ApiResponse } from "../../utils/apiResponse.js";

export function getHealth(_req, res) {
  return ApiResponse.ok({
    status: "ok",
    service: "reservation-system-api",
    timestamp: new Date().toISOString(),
  }).send(res);
}
