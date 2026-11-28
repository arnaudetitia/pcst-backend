import database = require("../database");
import { ecartList } from "../models/ecart.constant";
import { CSVQuestionColumns } from "../models/enums/csv-columns.enum";
import { ErreurImportFichier } from "../models/erreur-import-fichier.model";
import { QuestionVo } from "../models/question.model";
import { CsvReaderUtil } from "../utils/csv-reader.util";

function normalizeText(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return value
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\p{Cf}/gu, "")
    .toLocaleLowerCase("fr-FR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function containsMotIndice(question: string, motIndice: string): boolean {
  const normalizedMotIndice = normalizeText(motIndice);
  return (
    normalizedMotIndice.length > 0 &&
    normalizeText(question).indexOf(normalizedMotIndice) !== -1
  );
}

export class QuestionController {
  public async getAllQuestions() {
    const pool = database.Database.getPool();
    const result = await pool.query(
      `SELECT 
            q.id,
            q.question,
            q.mot_indice,
            q.bonne_reponse,
            q.reponses
        FROM pcst.questions q
        ORDER BY q.id
        `,
    );
    return result.rows;
  }

  public async createQuestion(questionVo: QuestionVo) {
    const pool = database.Database.getPool();
    await pool.query({
      text: `
        INSERT INTO pcst.questions(question, mot_indice, bonne_reponse, reponses)
        VALUES ($1,$2,$3,$4)
        `,
      values: [
        questionVo.question,
        questionVo.motIndice,
        questionVo.bonneReponse,
        questionVo.reponses,
      ],
    });
  }

  public async updateQuestion(idQuestion: number, questionVo: QuestionVo) {
    const pool = database.Database.getPool();
    await pool.query({
      text: ` 
        UPDATE pcst.questions 
        SET 
          question = $2,
          mot_indice = $3,
          bonne_reponse = $4,
          reponses = $5
        WHERE id = $1
        `,
      values: [
        idQuestion,
        questionVo.question,
        questionVo.motIndice,
        questionVo.bonneReponse,
        questionVo.reponses,
      ],
    });
  }

  public async importQuestions(csvContent: string, doImport: boolean) {
    const records = await CsvReaderUtil.parseRecords(csvContent);
    const erreurs: ErreurImportFichier[] = [];

    records.forEach((record, index) => {
      if (!record[CSVQuestionColumns.QUESTION]) {
        erreurs.push({
          ligne: index + 1,
          type: "error",
          message: 'Champ "question" manquant',
        });
      }
      if (!record[CSVQuestionColumns.MOT_INDICE]) {
        erreurs.push({
          ligne: index + 1,
          type: "error",
          message: 'Champ "mot_indice" manquant',
        });
      }
      if (
        record[CSVQuestionColumns.QUESTION] &&
        record[CSVQuestionColumns.MOT_INDICE] &&
        !containsMotIndice(
          record[CSVQuestionColumns.QUESTION],
          record[CSVQuestionColumns.MOT_INDICE],
        )
      ) {
        erreurs.push({
          ligne: index + 1,
          type: "error",
          message: "Le mot indice doit être compris dans la question",
        });
      }
      let bonneReponse: number | null = null;
      if (!record[CSVQuestionColumns.BONNE_REPONSE]) {
        erreurs.push({
          ligne: index + 1,
          type: "error",
          message: 'Champ "bonne_reponse" manquant',
        });
      } else {
        bonneReponse = Number.parseInt(
          record[CSVQuestionColumns.BONNE_REPONSE],
        );
        if (bonneReponse && bonneReponse <= 0) {
          erreurs.push({
            ligne: index + 1,
            type: "error",
            message: "La bonne réponse doit être un nombre positif",
          });
        }
      }
      let place: number | null = null;
      if (!record[CSVQuestionColumns.PLACE]) {
        erreurs.push({
          ligne: index + 1,
          type: "error",
          message: 'Champ "place" manquant',
        });
      } else {
        place = Number.parseInt(record[CSVQuestionColumns.PLACE]);
        if (place && (place <= 0 || place > 10)) {
          erreurs.push({
            ligne: index + 1,
            type: "error",
            message: "La place doit être comprise entre 1 et 10",
          });
        }
      }
      let reponseMin: number | null = null;
      if (!record[CSVQuestionColumns.REPONSE_MIN]) {
        erreurs.push({
          ligne: index + 1,
          type: "error",
          message: 'Champ "reponse_min" manquant',
        });
      } else {
        reponseMin = Number.parseInt(record[CSVQuestionColumns.REPONSE_MIN]);
        if (reponseMin && reponseMin <= 0) {
          erreurs.push({
            ligne: index + 1,
            type: "error",
            message: "La réponse minimale doit être un nombre positif",
          });
        }
      }
      let reponseMax: number | null = null;
      if (!record[CSVQuestionColumns.REPONSE_MAX]) {
        erreurs.push({
          ligne: index + 1,
          type: "error",
          message: 'Champ "reponse_min" manquant',
        });
      } else {
        reponseMax = Number.parseInt(record[CSVQuestionColumns.REPONSE_MAX]);
        if (reponseMax && reponseMax <= 0) {
          erreurs.push({
            ligne: index + 1,
            type: "error",
            message: "La réponse minimale doit être un nombre positif",
          });
        }
      }
      if (
        reponseMin &&
        bonneReponse &&
        place &&
        reponseMin > bonneReponse &&
        place !== 1
      ) {
        erreurs.push({
          ligne: index + 1,
          type: "error",
          message:
            "La réponse minimale doit être inférieure à la bonne réponse",
        });
      }
      if (
        bonneReponse &&
        reponseMax &&
        place &&
        reponseMax < bonneReponse &&
        place !== 10
      ) {
        erreurs.push({
          ligne: index + 1,
          type: "error",
          message:
            "La réponse maximale doit être supérieure à la bonne réponse",
        });
      }
      if (
        reponseMin &&
        bonneReponse &&
        place &&
        bonneReponse === reponseMin &&
        place !== 1
      ) {
        erreurs.push({
          ligne: index + 1,
          type: "error",
          message:
            "Si la réponse minimale est la bonne réponse , alors place doit être égale à 1",
        });
      }
      if (
        reponseMax &&
        bonneReponse &&
        place &&
        bonneReponse === reponseMax &&
        place !== 10
      ) {
        erreurs.push({
          ligne: index + 1,
          type: "error",
          message:
            "Si la réponse maximale est la bonne réponse , alors place doit être égale à 10",
        });
      }
      const ecartMinimalAvant = place ? ecartList.get(place)?.avant : null;
      if (
        reponseMin &&
        place &&
        bonneReponse &&
        ecartMinimalAvant &&
        bonneReponse - reponseMin < ecartMinimalAvant
      ) {
        erreurs.push({
          ligne: index + 1,
          type: "error",
          message:
            "Incohérence : il n'y aura pas assez de place entre la réponse minimale et la bonne réponse",
        });
      }
      const ecartMinimalApres = place ? ecartList.get(place)?.apres : null;
      if (
        bonneReponse &&
        place &&
        reponseMax &&
        ecartMinimalApres &&
        reponseMax - bonneReponse < ecartMinimalApres
      ) {
        erreurs.push({
          ligne: index + 1,
          type: "error",
          message:
            "Incohérence : il n'y aura pas assez de place entre la bonne réponse et la réponse maximale",
        });
      }
    });
    if (doImport && erreurs.length === 0) {
      const questionVoList: QuestionVo[] = records.map((record) => {
        const reponseMin = Number.parseInt(
          record[CSVQuestionColumns.REPONSE_MIN],
        );
        const bonneReponse = Number.parseInt(
          record[CSVQuestionColumns.BONNE_REPONSE],
        );
        const reponseMax = Number.parseInt(
          record[CSVQuestionColumns.REPONSE_MAX],
        );
        const place = Number.parseInt(record[CSVQuestionColumns.PLACE]);
        return {
          question: record[CSVQuestionColumns.QUESTION],
          motIndice: record[CSVQuestionColumns.MOT_INDICE],
          bonneReponse,
          reponses: this.generateReponses(
            reponseMin,
            reponseMax,
            bonneReponse,
            place,
          ),
        };
      });

      await this.createQuestionFromImport(questionVoList);
    }
    return erreurs;
  }

  generateReponses(
    reponseMin: number,
    reponseMax: number,
    bonneReponse: number,
    place: number,
  ): number[] {
    const nbReponsesAvant = ecartList.get(place)?.avant || 0;
    const nbReponsesApres = ecartList.get(place)?.apres || 0;
    const reponsesAvant = new Set<number>();
    const reponsesApres = new Set<number>();
    for (let i = 0; i < nbReponsesAvant; i++) {
      let reponse: number;
      do {
        reponse =
          Math.floor(Math.random() * (bonneReponse - reponseMin - 1)) +
          reponseMin +
          1;
      } while (reponsesAvant.has(reponse));
      reponsesAvant.add(reponse);
    }
    for (let i = 0; i < nbReponsesApres; i++) {
      let reponse: number;
      do {
        reponse =
          Math.floor(Math.random() * (reponseMax - bonneReponse - 1)) +
          bonneReponse +
          1;
      } while (reponsesApres.has(reponse));
      reponsesApres.add(reponse);
    }

    return [
      ...(place !== 1 ? [reponseMin] : []),
      ...Array.from(reponsesAvant),
      bonneReponse,
      ...Array.from(reponsesApres),
      ...(place !== 10 ? [reponseMax] : []),
    ].sort((a, b) => a - b);
  }

  private async createQuestionFromImport(questionVoList: QuestionVo[]) {
    const pool = database.Database.getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const questionVo of questionVoList) {
        await client.query({
          text: `
            INSERT INTO pcst.questions(question, mot_indice, bonne_reponse, reponses)
            VALUES ($1,$2,$3,$4)
            `,
          values: [
            questionVo.question,
            questionVo.motIndice,
            questionVo.bonneReponse,
            questionVo.reponses,
          ],
        });
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
}
