import { successResponse } from "../../utils/api-response.js";

export async function getCurrentUser(_req, res) {
  return res.status(200).json(successResponse(res.locals.user));
}
