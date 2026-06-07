import { ReservationStatus } from "@prisma/client"
import { z } from "zod"

export const reservationIdParamsSchema = z.object({
  id: z.uuid("Invalid reservation id."),
})

export const getReservationsQuerySchema = z.object({
  roomId: z.uuid("Invalid room id.").optional(),
  status: z.enum(ReservationStatus).optional(),
})

export const createReservationBodySchema = z.object({
  roomId: z.uuid("Invalid room id."),
  title: z.string().trim().min(1, "Reservation title is required."),
  description: z.string().trim().optional(),
  startTime: z.iso.datetime("Invalid start datetime."),
  endTime: z.iso.datetime("Invalid end datetime."),
})
