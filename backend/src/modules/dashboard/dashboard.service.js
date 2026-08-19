import { countActiveRooms } from "../../repositories/room.repository.js";
import { reservationRepository } from "../../repositories/reservation.repository.js";

export async function getDashboard(userId) {
  const [activeRoomsCount, nextReservations] = await Promise.all([
    countActiveRooms(),
    reservationRepository.findNextActiveForUser(userId),
  ]);

  return {
    activeRoomsCount,
    nextReservations,
  };
}
