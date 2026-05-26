import { z } from "zod";

export const getRoomsQuerySchema = z.object({
  active: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      return value === "true";
    }),

  capacityMin: z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined || value === "") {
        return undefined;
      }

      return Number(value);
    })
    .pipe(z.number().int().positive().optional()),
});

export const roomIdParamsSchema = z.object({
  id: z.uuid("Invalid room id."),
});

export const roomAvailabilityQuerySchema = z.object({
  start: z.iso.datetime("Invalid start datetime."),
  end: z.iso.datetime("Invalid end datetime."),
}).refine(
  (data) => new Date(data.start) < new Date(data.end),
  {
    message: "Start time must be earlier than end time.",
    path: ["end"], // Wskaże pole, którego dotyczy błąd dla frontendu
  }
);