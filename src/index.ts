import { PrismaClient } from "@prisma/client";
import express from "express";
import bodyParser from "body-parser";
import { procurarLinhasInvalidas } from "./validacao";
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?pool_timeout=40&connection_limit=23",
    },
  },
});

const app = express();
app.use(bodyParser);
app.use(bodyParser.json());

const port = 3030;

app.listen(port, () => {
  console.log("Callback online");
});

procurarLinhasInvalidas();

// prisma.importacao_linhas_arquivo.findUnique({where: {id: 76}, select: {importacao_arquivos: {select: }}});
