import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { getHealthResponse } from "./health.js";
import { deviceRouter } from "./routes/device-routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "64kb" }));
  app.use(pinoHttp());
  app.use(
    rateLimit({
      legacyHeaders: false,
      limit: 120,
      standardHeaders: true,
      windowMs: 60_000
    })
  );

  app.get("/healthz", (_req, res) => {
    res.status(200).json(getHealthResponse());
  });

  app.use("/device", deviceRouter);

  return app;
}
