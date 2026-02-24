import pino from "pino";
import { env } from "./env";

export const logger = pino({
  name: env.APP_NAME,
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.mobile",
      "req.body.idCard",
      "req.body.realName",
      "req.body.password"
    ],
    censor: "[REDACTED]"
  }
});
