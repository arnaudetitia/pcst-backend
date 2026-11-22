import database = require("../database");
import { QuestionVo } from "../models/question.model";

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
}
