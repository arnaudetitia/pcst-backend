import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { QuestionController } from "./controllers/question.controller";
import { QuestionVo } from "./models/question.model";
import { PartieController } from "./controllers/partie.controllers";

export class App {
  public app: Application;
  public questionsController: QuestionController;
  public partiesController: PartieController;

  constructor() {
    this.app = express();
    this.questionsController = new QuestionController();
    this.partiesController = new PartieController();
    this.config();
    this.routes();
  }

  private config(): void {
    dotenv.config({
      path: `environments/environment.${process.env.NODE_ENV}`,
    });
    const allowedOrigins = [
      "http://localhost:4200",
      "https://pcst-host.onrender.com",
    ];
    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (process.env.NODE_ENV === "prod") {
            if (origin && allowedOrigins.includes(origin)) callback(null, true);
            else {
              callback(new Error("Interdit"));
            }
          } else {
            callback(null, true);
          }
        },
      }),
    );
    this.app.use(express.json());
  }

  private routes(): void {
    //HEALTH

    this.app.get("/health", async (req, res) => {
      return res.status(200).json(true);
    });

    // ADMIN
    this.app.post("/admin", async (req, res) => {
      if (req.body.mdpAdmin.localeCompare(process.env.ADMIN_PASSWORD) === 0) {
        return res.status(200).json({ success: true });
      }
      return res.status(403).json({ error: "Mot de passe incorrect" });
    });

    // QUESTIONS
    this.app.get("/questions", async (req, res) => {
      try {
        const allQuestions = await this.questionsController.getAllQuestions();
        res.json(allQuestions.map((question) => this.mapQuestion(question)));
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de toutes les questions:",
          error,
        );
        res.status(500).json({ error: "Erreur serveur" });
      }
    });

    this.app.post("/questions", async (req, res) => {
      try {
        const questionVo = req.body.question;
        await this.questionsController.createQuestion(questionVo);
        const allQuestions = await this.questionsController.getAllQuestions();
        res.json(allQuestions.map((question) => this.mapQuestion(question)));
      } catch (error) {
        console.error("Erreur lors de l'insertion d'une question:", error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    });

    this.app.put("/questions", async (req, res) => {
      const idQuestion = req.body.idQuestion;
      try {
        const questionVo = req.body.question;
        await this.questionsController.updateQuestion(idQuestion, questionVo);
        const allQuestions = await this.questionsController.getAllQuestions();
        res.json(allQuestions.map((question) => this.mapQuestion(question)));
      } catch (error) {
        console.error(
          "Erreur lors de la mise à jour de la question d'id " +
            idQuestion +
            ":",
          error,
        );
        res.status(500).json({ error: "Erreur serveur" });
      }
    });

    this.app.post("/questions/import", async (req, res) => {
      try {
        const csvContent = req.body.csvFileContent;
        const doImport = req.body.doImport;
        const erreurs = await this.questionsController.importQuestions(
          csvContent,
          doImport,
        );
        if (erreurs.length > 0) {
          res.json({ erreurs, questions: [] });
        } else {
          const allQuestions = await this.questionsController.getAllQuestions();
          res.json({
            erreurs: [],
            questions: allQuestions.map((question) =>
              this.mapQuestion(question),
            ),
          });
        }
      } catch (error) {
        console.error("Erreur lors de la mise l'import des questions :", error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    });

    //PARTIES
    this.app.get("/parties", async (req, res) => {
      try {
        const allParties = await this.partiesController.getAllParties();
        res.json(
          allParties.map((partie) => {
            return {
              id: Number.parseInt(partie.id),
              nom_partie: partie.nom_partie,
              liste_questions: partie.liste_questions,
            };
          }),
        );
      } catch (error) {
        console.error("Erreur lors de la récupération des parties:", error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    });
  }

  public mapQuestion(question: any) {
    return {
      ...question,
      id: Number(question.id),
      bonne_reponse: Number.parseInt(question.bonne_reponse),
      reponses: question.reponses.map((r: string) => Number.parseInt(r)),
    };
  }

  public listen(port: number): void {
    this.app.listen(port, () => {
      console.log(`🚀 Serveur en classe tournant sur http://localhost:${port}`);
    });
  }
}
