import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MEASUREMENT_TITLE_PREFIX = "[MEASUREMENT]";
const WRITE_TEST_TITLE_PREFIX = "[TEST-RUN]";
const GENERATED_ROOM_PREFIX = "Sala Pomiarowa ";

const mediumDataset = {
  name: "MEDIUM",
  roomCount: 50,
  reservationCount: 200,
};

const baseRoomDefinitions = [
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

const capacities = [4, 6, 8, 10, 12, 16, 20, 24, 30];
const buildings = ["A", "B", "C", "D", "E"];
const timeSlots = [
  { hour: 8, minute: 0 },
  { hour: 9, minute: 30 },
  { hour: 11, minute: 0 },
  { hour: 12, minute: 30 },
  { hour: 14, minute: 0 },
  { hour: 15, minute: 30 },
  { hour: 17, minute: 0 },
];

function createRoomDefinitions(roomCount) {
  if (roomCount < baseRoomDefinitions.length) {
    throw new Error(
      `Room count must be at least ${baseRoomDefinitions.length}.`,
    );
  }

  const generatedRooms = Array.from(
    { length: roomCount - baseRoomDefinitions.length },
    (_, index) => {
      const roomNumber = baseRoomDefinitions.length + index + 1;
      const building = buildings[index % buildings.length];
      const floor = Math.floor(index / buildings.length) % 4;

      return {
        name: `${GENERATED_ROOM_PREFIX}${String(roomNumber).padStart(3, "0")}`,
        location: `Budynek ${building}, ${floor === 0 ? "parter" : `pietro ${floor}`}`,
        description: `Sala pomiarowa ${roomNumber} do spotkan, prezentacji i pracy zespolowej.`,
        capacity: capacities[index % capacities.length],
        isActive: roomNumber % 10 !== 0,
      };
    },
  );

  return [...baseRoomDefinitions, ...generatedRooms];
}

function getBaseDate() {
  const now = new Date();

  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function getScheduledTime(baseDate, sequence, dayStart, isHistorical = false) {
  const slotCycle = Math.floor(sequence / timeSlots.length);
  const slot = timeSlots[sequence % timeSlots.length];
  const dayOffset = dayStart + slotCycle;
  const startTime = new Date(baseDate);

  startTime.setUTCDate(
    startTime.getUTCDate() + (isHistorical ? -dayOffset : dayOffset),
  );
  startTime.setUTCHours(slot.hour, slot.minute, 0, 0);

  return {
    startTime,
    endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
  };
}

function createReservations({
  datasetName,
  reservationCount,
  userId,
  activeRooms,
  baseDate,
}) {
  const activeCount = Math.floor(reservationCount * 0.7);
  const futureCancelledCount = Math.floor(reservationCount * 0.15);
  const reservations = [];

  for (let index = 0; index < reservationCount; index += 1) {
    const room = activeRooms[index % activeRooms.length];
    let status;
    let schedule;
    let titleType;

    if (index < activeCount) {
      status = "ACTIVE";
      titleType = "Aktywna rezerwacja";
      schedule = getScheduledTime(
        baseDate,
        Math.floor(index / activeRooms.length),
        1,
      );
    } else if (index < activeCount + futureCancelledCount) {
      const cancelledIndex = index - activeCount;
      status = "CANCELLED";
      titleType = "Anulowana przyszla rezerwacja";
      schedule = getScheduledTime(
        baseDate,
        Math.floor(cancelledIndex / activeRooms.length),
        30,
      );
    } else {
      const historicalIndex = index - activeCount - futureCancelledCount;
      status = "CANCELLED";
      titleType = "Anulowana historyczna rezerwacja";
      schedule = getScheduledTime(
        baseDate,
        Math.floor(historicalIndex / activeRooms.length),
        1,
        true,
      );
    }

    reservations.push({
      userId,
      roomId: room.id,
      title: `${MEASUREMENT_TITLE_PREFIX}[${datasetName}] ${String(index + 1).padStart(4, "0")} ${titleType}`,
      description:
        "Rezerwacja utworzona do powtarzalnych pomiarow wydajnosci frontendow.",
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      status,
    });
  }

  return reservations;
}

async function removeStaleGeneratedRooms(
  transaction,
  desiredGeneratedRoomNames,
) {
  const staleRooms = await transaction.room.findMany({
    where: {
      name: {
        startsWith: GENERATED_ROOM_PREFIX,
        notIn: desiredGeneratedRoomNames,
      },
    },
    select: { id: true },
  });

  let removedRooms = 0;
  let retainedRooms = 0;

  for (const room of staleRooms) {
    const reservationCount = await transaction.reservation.count({
      where: { roomId: room.id },
    });

    if (reservationCount === 0) {
      await transaction.room.delete({ where: { id: room.id } });
      removedRooms += 1;
    } else {
      retainedRooms += 1;
    }
  }

  return { removedRooms, retainedRooms };
}

async function validateStrictDataset(
  transaction,
  userId,
  expectedRoomCount,
  expectedReservationCount,
) {
  if (process.env.MEASUREMENT_STRICT_DATASET !== "true") {
    return;
  }

  const [roomCount, reservationCount] = await Promise.all([
    transaction.room.count(),
    transaction.reservation.count({ where: { userId } }),
  ]);

  if (
    roomCount !== expectedRoomCount ||
    reservationCount !== expectedReservationCount
  ) {
    throw new Error(
      "Baza pomiarowa zawiera dane spoza datasetu. " +
        `Sale: ${roomCount}/${expectedRoomCount}, ` +
        `rezerwacje uzytkownika: ${reservationCount}/${expectedReservationCount}. ` +
        "Uzyj osobnej, czystej bazy i dedykowanego konta pomiarowego.",
    );
  }
}

export async function runMeasurementSeed({
  name: datasetName,
  roomCount,
  reservationCount,
}) {
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

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
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
    const roomDefinitions = createRoomDefinitions(roomCount);
    const desiredGeneratedRoomNames = roomDefinitions
      .filter((room) => room.name.startsWith(GENERATED_ROOM_PREFIX))
      .map((room) => room.name);

    const result = await prisma.$transaction(
      async (transaction) => {
        await transaction.reservation.deleteMany({
          where: {
            userId: user.id,
            OR: [
              { title: { startsWith: MEASUREMENT_TITLE_PREFIX } },
              { title: { startsWith: WRITE_TEST_TITLE_PREFIX } },
            ],
          },
        });

        const staleRoomResult = await removeStaleGeneratedRooms(
          transaction,
          desiredGeneratedRoomNames,
        );
        const rooms = [];
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

          rooms.push(room);
        }

        const activeRooms = rooms.filter((room) => room.isActive);
        const reservations = createReservations({
          datasetName,
          reservationCount,
          userId: user.id,
          activeRooms,
          baseDate,
        });

        await transaction.reservation.createMany({ data: reservations });

        await validateStrictDataset(
          transaction,
          user.id,
          roomDefinitions.length,
          reservations.length,
        );

        return {
          ...staleRoomResult,
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
      { timeout: 120_000 },
    );

    console.log(`Measurement seed ${datasetName} completed.`);
    console.log(`Uzytkownik testowy: ${user.email}`);
    console.log(
      `Sale datasetu: ${result.createdRooms + result.updatedRooms} (utworzone: ${result.createdRooms}, zaktualizowane: ${result.updatedRooms})`,
    );
    console.log(`Rezerwacje ACTIVE: ${result.activeReservations}`);
    console.log(`Rezerwacje CANCELLED: ${result.cancelledReservations}`);
    console.log(`Usuniete nieuzywane sale pomiarowe: ${result.removedRooms}`);

    if (result.retainedRooms > 0) {
      console.warn(
        `Zachowano ${result.retainedRooms} starszych sal pomiarowych, poniewaz maja zwykle rezerwacje.`,
      );
    }

    console.log(`Data bazowa (UTC): ${baseDate.toISOString()}`);
  } finally {
    await prisma.$disconnect();
  }
}

export async function runMeasurementSeedFromCli(configuration) {
  try {
    await runMeasurementSeed(configuration);
  } catch (error) {
    console.error(`Measurement seed failed: ${error.message}`);
    process.exitCode = 1;
  }
}

const isMainModule = process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMainModule) {
  await runMeasurementSeedFromCli(mediumDataset);
}
