import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { QuestionController } from "./controllers/question.controller";

export class App {
  public app: Application;
  public questionsController: QuestionController;

  constructor() {
    this.app = express();
    this.questionsController = new QuestionController();
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
        res.json(
          allQuestions.map((question) => {
            return {
              ...question,
              id: Number(question.id),
              bonne_reponse: Number.parseInt(question.bonne_reponse),
              reponses: question.reponses.map((r: string) =>
                Number.parseInt(r),
              ),
            };
          }),
        );
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de toutes les questions:",
          error,
        );
        res.status(500).json({ error: "Erreur serveur" });
      }
    });
  }

  public listen(port: number): void {
    this.app.listen(port, () => {
      console.log(`🚀 Serveur en classe tournant sur http://localhost:${port}`);
    });
  }
}
