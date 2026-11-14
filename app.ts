import express, { Application } from "express";
import cors from "cors";

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.config();
    this.routes();
  }

  private config(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private routes(): void {}

  public listen(port: number): void {
    this.app.listen(port, () => {
      console.log(`🚀 Serveur en classe tournant sur http://localhost:${port}`);
    });
  }
}
