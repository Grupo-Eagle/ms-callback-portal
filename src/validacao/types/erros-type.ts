export type GetErrosArquivoResponse = {
  error: {
    descricao: string;
    critico: boolean;
    linha_id: bigint;
    external_id: bigint;
    endpointToReturn: string | null;
  };
};
