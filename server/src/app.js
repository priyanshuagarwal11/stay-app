import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { auth } from "./routes/auth.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",") }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => res.json({ ok: true, name: config.appName }));
  app.use("/auth", auth);

  app.use((_req, res) => res.status(404).json({ error: "not_found", message: "Not found." }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "invalid_json", message: "Invalid request." });
    console.error(err);
    res.status(500).json({ error: "server_error", message: "Something went wrong. Please try again." });
  });
  return app;
}
