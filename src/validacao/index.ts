import { PORTAL_USER_ID } from "../common/consts/constants";
import { LogError } from "../common/log-error";
import { GetErrosArquivoResponse } from "./types/erros-type";
import { getLinhasArquivosInvalidos } from "./services/get-linhas-arquivos-invalidos";

import { getErrosArquivoId, sendToMsExternal, alteraStatus } from "./services/get-errors-arquivo";

export const procurarLinhasInvalidas = async () => {
  try {
    const linhasArquivosInvalidos = await getLinhasArquivosInvalidos();
    let response: GetErrosArquivoResponse[];

    for (const arquivo_id of linhasArquivosInvalidos) {
      response = await getErrosArquivoId(arquivo_id);
      await sendToMsExternal(response, arquivo_id);
    }
    console.log("teste");
    toInterval();
  } catch (error) {
    throw new LogError({
      chave_erro: "CALLBACK_FILA",
      portal_user_id: PORTAL_USER_ID,
      mensagem: `${error}`,
    });
  }
};

export const toInterval = async () => {
  setTimeout(async () => await procurarLinhasInvalidas(), 8000);
};
