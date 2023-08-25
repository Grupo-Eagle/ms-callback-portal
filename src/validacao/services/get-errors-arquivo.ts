import axios, { AxiosError } from "axios";
import { prisma } from "../..";
import { GetErrosArquivoResponse } from "../types/erros-type";
import { LogError } from "../../common/log-error";
import { PORTAL_USER_ID } from "../../common/consts/constants";

export const getErrosArquivoId = async (arquivo_id: number): Promise<GetErrosArquivoResponse[]> => {
  const response: GetErrosArquivoResponse[] = [];

  const errors = await prisma.callback_fila.findMany({
    where: {
      arquivo_id: arquivo_id,
      tentativas_de_retorno: {
        lt: 5,
      },
    },
    select: {
      importacao_arquivos: {
        select: {
          correspondentes: {
            select: {
              correspondentes_vinculos_user: {
                select: {
                  endpoint_retorno_negocios: true,
                },
                where: {
                  endpoint_retorno_negocios: {
                    not: null,
                  },
                },
              },
            },
          },
        },
      },
      importacao_linhas_arquivo: {
        select: {
          id: true,
          external_id: true,
          importacao_erros_linha: {
            select: {
              importacao_erros: true,
            },
          },
        },
      },
    },
  });

  for (const linhas of errors) {
    for (const linhaErros of linhas.importacao_linhas_arquivo.importacao_erros_linha) {
      response.push({
        error: {
          critico: linhaErros.importacao_erros.critico,
          descricao: linhaErros.importacao_erros.descricao,
          linha_id: linhas.importacao_linhas_arquivo.id,
          external_id: linhas.importacao_linhas_arquivo.external_id ?? BigInt(0),
          endpointToReturn:
            linhas.importacao_arquivos.correspondentes.correspondentes_vinculos_user[0]
              .endpoint_retorno_negocios ?? null,
        },
      });
    }
  }

  return response;
};

export const sendToMsExternal = async (response: GetErrosArquivoResponse[], arquivo_id: Number) => {
  try {
    const consolidatedArray = [];
    const endpointToReturn = response[0].error.endpointToReturn;
    if (endpointToReturn !== null) {
      for (const item of response) {
        const { linha_id, external_id, ...errorWithoutIds } = item.error;
        consolidatedArray.push({
          error: {
            ...errorWithoutIds,
            linha_id: Number(linha_id),
            external_id: Number(external_id),
          },
        });
      }
      const postResponse = await axios.post(endpointToReturn, consolidatedArray);

      if (postResponse.status === 200) {
        await alteraStatus(response);
      }
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      await addContTentativasRetorno(response);
      new LogError({
        chave_erro: "CALLBACK_FILA",
        portal_user_id: PORTAL_USER_ID,
        mensagem: `${error}`,
      });
    }
  }
};

export const alteraStatus = async (response: GetErrosArquivoResponse[]) => {
  const consolidatedArray = [];

  for (const linhas of response) {
    consolidatedArray.push(Number(linhas.error.linha_id));
  }

  const statusEnviado = await prisma.status.findFirst({
    where: {
      chave: "LINHA_ENVIADA",
    },
  });

  if (!statusEnviado) {
    console.error("Status 'LINHA_ENVIADA' não encontrado.");
    return;
  }

  await prisma.callback_fila.updateMany({
    data: {
      status_id: statusEnviado.id,
    },
    where: {
      linha_id: {
        in: consolidatedArray,
      },
    },
  });
};

export const addContTentativasRetorno = async (response: GetErrosArquivoResponse[]) => {
  const arrayLinhas = [];
  let quantidadeRetorno: any;
  const MAX_TENTATIVAS = 5;
  let tentativasCont = 0;
  for (const linhas of response) {
    arrayLinhas.push(Number(linhas.error.linha_id));
  }
  console.log(arrayLinhas);

  for (const linha of arrayLinhas) {
    quantidadeRetorno = await prisma.callback_fila.findFirst({
      select: {
        tentativas_de_retorno: true,
        arquivo_id: true,
      },
      where: {
        linha_id: linha,
      },
    });

    tentativasCont = quantidadeRetorno.tentativas_de_retorno + 1;

    await prisma.callback_fila.updateMany({
      data: {
        tentativas_de_retorno: tentativasCont,
      },
      where: {
        linha_id: {
          equals: linha,
        },
      },
    });

    if (tentativasCont == 5) {
      const statusLimiteTentativasExcedidas = await prisma.status.findFirst({
        where: {
          chave: "TENTATIVAS_EXCEDIDAS",
        },
      });

      if (!statusLimiteTentativasExcedidas) {
        console.error("Status 'TENTATIVAS_EXCEDIDAS' não encontrado.");
        return;
      }

      await prisma.callback_fila.updateMany({
        data: {
          status_id: statusLimiteTentativasExcedidas.id,
        },
        where: {
          linha_id: {
            equals: linha,
          },
        },
      });
    }
    console.log(tentativasCont);
  }
};
