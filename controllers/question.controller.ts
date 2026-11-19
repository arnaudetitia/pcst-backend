import database = require("../database");

export class QuestionController {
  public async getAllQuestions() {
    const pool = database.Database.getPool();
    const result = await pool.query(
      `SELECT 
            q.id,
            q.question,
            q.mot_question,
            q.bonne_reponse,
            q.reponses
        FROM pcst.questions q
        `,
    );
    return result.rows;
  }
}
