import "dotenv/config"
import pg from "pg"; // natywnego sterownik PostgreSQL
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ConfigurationError } from "./config.errors.js";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if(!connectionString){
  throw new ConfigurationError("DATABASE_URL required");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({adapter});

// db conn funkcje podpiete w server.js
export async function connectDatabase(){
  await prisma.$connect();
}

export async function disconnectDatabase(){
  await prisma.$disconnect();
}
