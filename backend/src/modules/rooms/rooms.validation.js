import { z } from "zod";

const optionalPositiveIntFromQuery = z
  .string()
  .optional()
  .transform((value) => {
    if (value === undefined || value.trim() === "") {
      return undefined;
    }

    return Number(value);
  })
  .pipe(z.number().int().positive().optional());

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

  capacityMin: optionalPositiveIntFromQuery,
});

export const roomIdParamsSchema = z.object({
  id: z.uuid("Invalid room id."),
});

export const roomAvailabilityQuerySchema = z.object({
  start: z.iso.datetime("Invalid start datetime."),
  end: z.iso.datetime("Invalid end datetime."),
});