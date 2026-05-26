import {PrismaClient} from "@prisma/client"
import {PrismaPg} from "@prisma/adapter-pg"

const connectionString = process.env.DATABASE_URL;

if(!connectionString){
  throw new Error("DATABASE_URL required");
}

const adapter = new PrismaPg({connectionString});

export const prisma = new PrismaClient({adapter});

// db conn funkcje podpiete w server.js
export async function connectDatabase(){
  await prisma.$connect();
}

export async function disconnectDatabase(){
  await prisma.$disconnect();
}