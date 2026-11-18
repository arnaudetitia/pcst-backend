import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";

export class App {
  public app: Application;

  constructor() {
    this.app = express();
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
  }

  public listen(port: number): void {
    this.app.listen(port, () => {
      console.log(`🚀 Serveur en classe tournant sur http://localhost:${port}`);
    });
  }
}
