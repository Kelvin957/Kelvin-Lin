import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/mysql";
import { calcReservationQuote, createReservationRecord } from "../modules/reservation/reservation.service";

const router = Router();

const quoteSchema = z.object({
  startAt: z.string(),
  endAt: z.string(),
  pricePerMinute: z.number().positive(),
  minDurationMin: z.number().int().positive().default(60),
  advanceBookingMin: z.number().int().nonnegative().default(30)
});

router.post("/reservations/quote", (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      code: "INVALID_PAYLOAD",
      message: "请求参数错误",
      details: parsed.error.flatten().fieldErrors
    });
  }

  try {
    const quote = calcReservationQuote(parsed.data);
    return res.json({ code: "OK", ...quote });
  } catch (error) {
    return res.status(422).json({
      code: "INVALID_BOOKING_RULE",
      message: error instanceof Error ? error.message : "预约规则校验失败"
    });
  }
});

const createSchema = z.object({
  userId: z.number().int().positive(),
  storeId: z.number().int().positive(),
  seatId: z.number().int().positive(),
  startAt: z.string(),
  endAt: z.string(),
  pricePerMinute: z.number().positive(),
  minDurationMin: z.number().int().positive().default(60),
  advanceBookingMin: z.number().int().nonnegative().default(30)
});

router.post("/reservations", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      code: "INVALID_PAYLOAD",
      message: "请求参数错误",
      details: parsed.error.flatten().fieldErrors
    });
  }

  try {
    const quote = calcReservationQuote(parsed.data);
    const created = await createReservationRecord(pool, {
      userId: parsed.data.userId,
      storeId: parsed.data.storeId,
      seatId: parsed.data.seatId,
      startAt: parsed.data.startAt,
      endAt: parsed.data.endAt,
      durationMin: quote.durationMin,
      amount: quote.amount
    });

    return res.status(201).json({
      code: "OK",
      reservationNo: created.reservationNo,
      amount: quote.amount,
      durationMin: quote.durationMin
    });
  } catch (error) {
    return res.status(422).json({
      code: "RESERVATION_CREATE_FAILED",
      message: error instanceof Error ? error.message : "创建预约失败"
    });
  }
});

export const reservationRouter = router;
