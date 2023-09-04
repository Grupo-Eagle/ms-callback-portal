import knex from "knex";
import { prisma } from "..";

export const intranet = knex({
  client: "mysql",
  connection: {
    host: process.env.HOST_INTRANET,
    port: Number(process.env.PORT_INTRANET),
    user: process.env.USER_INTRANET,
    password: process.env.PASS_INTRANET,
    database: process.env.DATABASE_INTRANET,
  },
});
