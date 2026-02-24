import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { logger } from "./config/logger";
import { requestIdMiddleware } from "./middleware/request-id";
import { complianceRouter } from "./routes/compliance.route";
import { healthRouter } from "./routes/health.route";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(requestIdMiddleware);
  app.use(pinoHttp({ logger }));

  app.use("/api", healthRouter);
  app.use("/api", complianceRouter);

  app.get("/", (_req, res) => {
    res.send("Booking Platform API is running");
  });

  return app;
}
