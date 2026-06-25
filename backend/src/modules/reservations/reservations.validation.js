import { ReservationStatus } from "@prisma/client"
import { z } from "zod"

export const reservationIdParamsSchema = z.object({
  id: z.uuid("Błędne reservation id."),
})

export const getReservationsQuerySchema = z.object({
  roomId: z.uuid("Błędne room id.").optional(),
  status: z.enum(ReservationStatus).optional(),
})

export const createReservationBodySchema = z.object({
  roomId: z.uuid("Błędne room id"),
  title: z.string().trim().min(1, "Nazwa rezerwacji wymagana"),
  description: z.string().trim().optional(),
  startTime: z.iso.datetime("Błędne startTime"),
  endTime: z.iso.datetime("Błędne endTime"),
})
