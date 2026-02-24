import { config } from "dotenv";
import { z } from "zod";

config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  APP_NAME: z.string().default("booking-platform"),
  MYSQL_HOST: z.string().default("127.0.0.1"),
  MYSQL_PORT: z.coerce.number().default(3306),
  MYSQL_USER: z.string().default("root"),
  MYSQL_PASSWORD: z.string().default(""),
  MYSQL_DATABASE: z.string().default("booking_platform"),
  PIPL_CONSENT_REQUIRED: z.enum(["true", "false"]).default("true"),
  LOG_RETENTION_DAYS: z.coerce.number().min(30).default(180)
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("环境变量校验失败", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
