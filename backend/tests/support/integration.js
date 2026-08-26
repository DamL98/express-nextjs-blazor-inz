import { prisma } from "../../src/config/prisma.js";
import { createSessionToken } from "../../src/security/jwt.js";

export function authorize(testRequest, token) {
  return testRequest.set("Authorization", `Bearer ${token}`);
}

export async function getUserSession(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user) {
    throw new Error(`Brak uzytkownika testowego: ${email}`);
  }

  return {
    user,
    token: createSessionToken(user),
  };
}

export function reservationSlot(day, month = "01") {
  const date = String(day).padStart(2, "0");

  return {
    startTime: `2035-${month}-${date}T10:00:00.000Z`,
    endTime: `2035-${month}-${date}T11:00:00.000Z`,
  };
}

export async function removeReservations(titlePrefix) {
  await prisma.reservation.deleteMany({
    where: {
      title: {
        startsWith: titlePrefix,
      },
    },
  });
}
