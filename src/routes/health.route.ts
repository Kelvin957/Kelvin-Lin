import { Router } from "express";
import { env } from "../config/env";
import { buildDataRetentionPolicy } from "../modules/compliance/compliance.service";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    app: env.APP_NAME,
    retentionPolicy: buildDataRetentionPolicy(env.LOG_RETENTION_DAYS)
  });
});

export const healthRouter = router;
