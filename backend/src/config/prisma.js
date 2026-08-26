import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { ConfigurationError } from "./config.errors.js";
import { getDatabaseEnvironment } from "./environment.js";

const { connectionString } = getDatabaseEnvironment();

if (!connectionString) {
  throw new ConfigurationError("DATABASE_URL required");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export async function connectDatabase() {
  await prisma.$connect();
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
