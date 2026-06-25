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
  id: z.uuid("Błędne room id."),
});

export const roomAvailabilityQuerySchema = z.object({
  start: z.iso.datetime("Błędne startTime"),
  end: z.iso.datetime("Błędne endTime"),
});