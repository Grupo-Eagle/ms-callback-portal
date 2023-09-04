import dotenv from "dotenv";

dotenv.config();

if (!process.env.PORTAL_USER_ID) {
  throw new Error("Váriavel de ambiente não definida.");
}

export const PORTAL_USER_ID = +process.env.PORTAL_USER_ID;
