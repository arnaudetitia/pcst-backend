import database = require("../database");

export class PartieController {
  public async getAllParties() {
    const pool = database.Database.getPool();
    const result = await pool.query(`
                SELECT 
                    p.id, 
                    p.nom_partie,
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                        'idQuestion', q.id,
                        'question', q.question,
                        'motIndice', q.mot_indice
                        )
                    ) as liste_questions
                FROM pcst.parties p
                JOIN pcst.questions q ON q.id = ANY(p.ids_questions)
                GROUP BY p.id, p.nom_partie
                ORDER BY p.id
                `);
    return result.rows;
  }
}
