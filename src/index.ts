import { PrismaClient } from "@prisma/client";


export const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + "?pool_timeout=40&connection_limit=23",
      },
    },
  });

prisma.
