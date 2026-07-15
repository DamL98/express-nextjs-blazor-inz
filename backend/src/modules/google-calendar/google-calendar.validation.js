import { z } from "zod";

export const googleCalendarConnectQuerySchema = z.object({
  redirectTo: z.url("Bledny redirectTo").optional(),
});
