import { Router } from "express";
import { z } from "zod";
import { checkPiplConsent } from "../modules/compliance/compliance.service";

const router = Router();

const bodySchema = z.object({
  consentAccepted: z.boolean()
});

router.post("/compliance/consent/check", (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      code: "INVALID_PAYLOAD",
      message: "请求参数错误",
      details: parsed.error.flatten().fieldErrors
    });
  }

  const result = checkPiplConsent(parsed.data.consentAccepted);
  if (!result.pass) {
    return res.status(403).json(result);
  }

  return res.json(result);
});

export const complianceRouter = router;
