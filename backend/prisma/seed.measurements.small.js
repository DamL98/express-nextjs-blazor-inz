import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const MEASUREMENT_TITLE_PREFIX = "[MEASUREMENT]";

const connectionString = process.env.DATABASE_URL;
const measurementUserEmail = process.env.MEASUREMENT_USER_EMAIL?.trim();

if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

if (!measurementUserEmail) {
  throw new Error(
    "MEASUREMENT_USER_EMAIL is required. Set it to the e-mail address of the measurement user.",
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const roomDefinitions = [
  {
    name: "Sala A-101",
    location: "Budynek A, parter",
    description: "Kameralna sala do spotkan projektowych i konsultacji.",
    capacity: 4,
    isActive: true,
  },
  {
    name: "Sala A-102",
    location: "Budynek A, parter",
    description: "Sala spotkan zespolowych z monitorem do prezentacji.",
    capacity: 6,
    isActive: true,
  },
  {
    name: "Sala A-201",
    location: "Budynek A, pietro 1",
    description: "Sala konferencyjna z projektorem i tablica suchoscieralna.",
    capacity: 8,
    isActive: true,
  },
  {
    name: "Sala A-202",
    location: "Budynek A, pietro 1",
    description: "Przestronna sala do warsztatow i spotkan dzialowych.",
    capacity: 10,
    isActive: true,
  },
  {
    name: "Sala B-101",
    location: "Budynek B, parter",
    description: "Sala z ekranem multimedialnym do prezentacji biznesowych.",
    capacity: 12,
    isActive: true,
  },
  {
    name: "Sala B-201",
    location: "Budynek B, pietro 1",
    description: "Duza sala konferencyjna do spotkan kilku zespolow.",
    capacity: 16,
    isActive: true,
  },
  {
    name: "Sala Konferencyjna",
    location: "Budynek Glowny",
    description: "Glowna sala konferencyjna z pelnym wyposazeniem AV.",
    capacity: 20,
    isActive: true,
  },
  {
    name: "Aula Projektowa",
    location: "Budynek Glowny",
    description: "Aula przeznaczona do przegladow projektow i szkolen.",
    capacity: 30,
    isActive: true,
  },
  {
    name: "Sala Serwisowa",
    location: "Budynek Techniczny",
    description: "Sala techniczna czasowo wylaczona z rezerwacji.",
    capacity: 6,
    isActive: false,
  },
  {
    name: "Sala Archiwalna",
    location: "Budynek C",
    description: "Dawna sala spotkan obecnie wykorzystywana jako archiwum.",
    capacity: 10,
    isActive: false,
  },
];

const reservationDefinitions = [
  { roomName: "Sala A-101", dayOffset: 1, hour: 9, minute: 0, status: "ACTIVE", title: "Planowanie sprintu" },
  { roomName: "Sala A-102", dayOffset: 1, hour: 10, minute: 30, status: "ACTIVE", title: "Przeglad wymagan" },
  { roomName: "Sala A-201", dayOffset: 1, hour: 13, minute: 15, status: "ACTIVE", title: "Spotkanie projektowe" },
  { roomName: "Sala A-202", dayOffset: 2, hour: 8, minute: 45, status: "ACTIVE", title: "Warsztat UX" },
  { roomName: "Sala B-101", dayOffset: 2, hour: 11, minute: 0, status: "ACTIVE", title: "Prezentacja wynikow" },
  { roomName: "Sala B-201", dayOffset: 2, hour: 14, minute: 30, status: "ACTIVE", title: "Spotkanie dzialowe" },
  { roomName: "Sala Konferencyjna", dayOffset: 3, hour: 9, minute: 30, status: "ACTIVE", title: "Przeglad kwartalny" },
  { roomName: "Aula Projektowa", dayOffset: 3, hour: 12, minute: 0, status: "ACTIVE", title: "Demo produktu" },
  { roomName: "Sala A-101", dayOffset: 3, hour: 15, minute: 15, status: "ACTIVE", title: "Retrospektywa" },
  { roomName: "Sala A-102", dayOffset: 4, hour: 9, minute: 0, status: "CANCELLED", title: "Anulowana konsultacja" },
  { roomName: "Sala A-201", dayOffset: 4, hour: 11, minute: 30, status: "CANCELLED", title: "Anulowany przeglad" },
  { roomName: "Sala A-202", dayOffset: 4, hour: 14, minute: 0, status: "CANCELLED", title: "Anulowany warsztat" },
  { roomName: "Sala B-101", dayOffset: -3, hour: 9, minute: 0, status: "CANCELLED", title: "Historyczna odprawa" },
  { roomName: "Sala B-201", dayOffset: -2, hour: 11, minute: 0, status: "CANCELLED", title: "Historyczny przeglad" },
  { roomName: "Sala Konferencyjna", dayOffset: -1, hour: 13, minute: 30, status: "CANCELLED", title: "Historyczne podsumowanie" },
];

function getBaseDate() {
  const now = new Date();

  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function getReservationTime(baseDate, definition) {
  const startTime = new Date(baseDate);
  startTime.setUTCDate(startTime.getUTCDate() + definition.dayOffset);
  startTime.setUTCHours(definition.hour, definition.minute, 0, 0);

  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

  return { startTime, endTime };
}

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: measurementUserEmail,
        mode: "insensitive",
      },
    },
  });

  if (!user) {
    throw new Error(
      `Nie znaleziono uzytkownika ${measurementUserEmail}. Najpierw zaloguj sie tym kontem przez aplikacje, a nastepnie uruchom seed ponownie.`,
    );
  }

  const baseDate = getBaseDate();

  const result = await prisma.$transaction(
    async (transaction) => {
      const roomsByName = new Map();
      let createdRooms = 0;
      let updatedRooms = 0;

      for (const roomDefinition of roomDefinitions) {
        const existingRoom = await transaction.room.findFirst({
          where: { name: roomDefinition.name },
          orderBy: { createdAt: "asc" },
        });

        const room = existingRoom
          ? await transaction.room.update({
              where: { id: existingRoom.id },
              data: roomDefinition,
            })
          : await transaction.room.create({ data: roomDefinition });

        if (existingRoom) {
          updatedRooms += 1;
        } else {
          createdRooms += 1;
        }

        roomsByName.set(room.name, room);
      }

      await transaction.reservation.deleteMany({
        where: {
          userId: user.id,
          title: { startsWith: MEASUREMENT_TITLE_PREFIX },
        },
      });

      const reservations = reservationDefinitions.map((definition, index) => {
        const room = roomsByName.get(definition.roomName);

        if (!room) {
          throw new Error(
            `Brak sali wymaganej przez seed: ${definition.roomName}.`,
          );
        }

        const { startTime, endTime } = getReservationTime(
          baseDate,
          definition,
        );

        return {
          userId: user.id,
          roomId: room.id,
          title: `${MEASUREMENT_TITLE_PREFIX} ${String(index + 1).padStart(2, "0")} ${definition.title}`,
          description:
            "Rezerwacja utworzona do powtarzalnych pomiarow frontendow.",
          startTime,
          endTime,
          status: definition.status,
        };
      });

      await transaction.reservation.createMany({ data: reservations });

      return {
        createdRooms,
        updatedRooms,
        activeReservations: reservations.filter(
          (reservation) => reservation.status === "ACTIVE",
        ).length,
        cancelledReservations: reservations.filter(
          (reservation) => reservation.status === "CANCELLED",
        ).length,
      };
    },
    { timeout: 30_000 },
  );

  console.log("Measurement seed completed.");
  console.log(`Uzytkownik testowy: ${user.email}`);
  console.log(
    `Sale utworzone/zaktualizowane: ${result.createdRooms + result.updatedRooms} (utworzone: ${result.createdRooms}, zaktualizowane: ${result.updatedRooms})`,
  );
  console.log(`Rezerwacje ACTIVE: ${result.activeReservations}`);
  console.log(`Rezerwacje CANCELLED: ${result.cancelledReservations}`);
  console.log(`Data bazowa (UTC): ${baseDate.toISOString()}`);
}

main()
  .catch((error) => {
    console.error(`Measurement seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
