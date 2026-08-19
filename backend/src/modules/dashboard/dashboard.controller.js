import { ApiResponse } from "../../utils/apiResponse.js";
import { getDashboard as getDashboardService } from "./dashboard.service.js";

export async function getDashboard(_req, res) {
  const dashboard = await getDashboardService(res.locals.user.id);

  return ApiResponse.ok(dashboard).send(res);
}
