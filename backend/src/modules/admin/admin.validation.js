import { ReservationStatus } from "@prisma/client"
import { z } from "zod"

export const getAdminReservationsQuerySchema = z.object({
  roomId: z.uuid("Błędne room id.").optional(),
  status: z.enum(ReservationStatus).optional(),
})

export const adminReservationIdParamsSchema = z.object({
  id: z.uuid("Błędne reservation id."),
})
