import { Router } from "express";
import { env } from "../config/env";

const router = Router();

router.get("/system/readiness", (_req, res) => {
  res.json({
    code: "OK",
    checks: {
      mysqlConfigured: Boolean(env.MYSQL_HOST && env.MYSQL_DATABASE && env.MYSQL_USER),
      piplConsentRequired: env.PIPL_CONSENT_REQUIRED === "true",
      logRetentionDays: env.LOG_RETENTION_DAYS
    }
  });
});

export const systemRouter = router;
