const knex = require("knex");
import { intranet } from "../Utils/Utils";

export type BaseMetadataLogError = {
  portal_user_id: number;
  mensagem: string;
  chave_erro: string;
};

export class LogError extends Error {
  metadata: BaseMetadataLogError;

  constructor(metadata: BaseMetadataLogError) {
    super(metadata.mensagem);
    this.name = this.constructor.name;
    this.metadata = metadata;
    Error.captureStackTrace(this, this.constructor);
    this.log();
  }

  async log() {
    console.log("log");
    try {
      const userCreateId = this.metadata.portal_user_id;
      const identificadorSubquery = intranet
        .select("id")
        .from("parametros")
        .where("chave", "LOG_ERRO");
      const erroIdSubquery = intranet
        .select("id")
        .from("erros")
        .where("chave", this.metadata.chave_erro);

      await intranet("logs_microsservicos").insert({
        user_create_id: userCreateId,
        identificador: identificadorSubquery,
        mensagem: this.metadata.mensagem,
        erro_id: erroIdSubquery,
      });
    } catch (error) {
      console.log(
        "Error while inserting log, chave error is: " +
          this.metadata.chave_erro +
          "the error is: " +
          error
      );
    }
  }
}
