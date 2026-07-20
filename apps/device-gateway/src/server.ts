import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { ZodError } from "zod";

import { getHealthResponse } from "./health.js";
import { deviceRouter } from "./routes/device-routes.js";

export type RequestWithRawBody = express.Request & {
  rawBody?: Buffer;
};

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    express.json({
      limit: "64kb",
      verify: (req, _res, buffer) => {
        (req as RequestWithRawBody).rawBody = Buffer.from(buffer);
      }
    })
  );
  app.use(pinoHttp());
  app.use(
    rateLimit({
      legacyHeaders: false,
      limit: 120,
      standardHeaders: true,
      windowMs: 60_000
    })
  );

  app.get("/ping", (_req, res) => {
    res.status(200).send("pong");
  });

  app.get("/healthz", (_req, res) => {
    res.status(200).json(getHealthResponse());
  });

  app.use("/device", deviceRouter);

  app.use(
    (error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "invalid_request", issues: error.issues });
        return;
      }

      if (error instanceof SyntaxError) {
        res.status(400).json({ error: "invalid_json" });
        return;
      }

      console.error("Unhandled error:", error);
      if (error instanceof Error) {
        console.error(error.stack);
      }

      res.status(500).json({ error: "internal_server_error" });
    }
  );

  return app;
}
