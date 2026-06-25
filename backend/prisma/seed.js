import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const userRole = await prisma.role.upsert({
    where: { name: "user" },
    update: {},
    create: { name: "user" },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin" },
  });

  await prisma.room.createMany({
    data: [
      {
        name: "Sala A101",
        location: "Budynek A, piętro 1",
        description: "Sala konferencyjna z projektorem i ekranem.",
        capacity: 12,
        isActive: true,
      },
      {
        name: "Sala B205",
        location: "Budynek B, piętro 2",
        description: "Większa sala przeznaczona na spotkania zespołowe.",
        capacity: 24,
        isActive: true,
      },
      {
        name: "Sala C310",
        location: "Budynek C, piętro 3",
        description: "Mała sala do konsultacji i krótkich spotkań.",
        capacity: 6,
        isActive: false,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      roleId: adminRole.id,
    },
    create: {
      googleId: "mock-google-admin-id",
      email: "admin@example.com",
      fullName: "Administrator Systemu",
      avatarUrl: null,
      roleId: adminRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {
      roleId: userRole.id,
    },
    create: {
      googleId: "mock-google-user-id",
      email: "user@example.com",
      fullName: "Jan Kowalski",
      avatarUrl: null,
      roleId: userRole.id,
    },
  });

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });