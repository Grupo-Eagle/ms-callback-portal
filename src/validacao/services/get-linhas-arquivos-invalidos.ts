import { prisma } from "../..";

export const getLinhasArquivosInvalidos = async () => {
  const linhas = await prisma.callback_fila.groupBy({
    by: ["arquivo_id"],
    where: {
      status: {
        chave: "NAO_ENVIADO",
      },
    },
  });
  const arquivoIds = linhas.map((item) => Number(item.arquivo_id));

  return arquivoIds;
};
