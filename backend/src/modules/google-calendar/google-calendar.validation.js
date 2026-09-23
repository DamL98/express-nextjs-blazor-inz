import { z } from "../../config/zod.js";

export const googleCalendarConnectQuerySchema = z.object({
  redirectTo: z.url("Bledny redirectTo").optional(),
});
