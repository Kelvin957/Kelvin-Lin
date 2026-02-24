import { randomUUID } from "node:crypto";
import type { Pool } from "mysql2/promise";
import type { ReservationQuoteInput, ReservationQuoteResult } from "./reservation.types";

export function calcReservationQuote(input: ReservationQuoteInput): ReservationQuoteResult {
  const start = new Date(input.startAt).getTime();
  const end = new Date(input.endAt).getTime();
  const now = Date.now();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    throw new Error("预约时间不合法");
  }

  const durationMin = Math.ceil((end - start) / 60000);
  if (durationMin < input.minDurationMin) {
    throw new Error(`预约时长不能少于 ${input.minDurationMin} 分钟`);
  }

  const diffToStartMin = Math.floor((start - now) / 60000);
  if (diffToStartMin < input.advanceBookingMin) {
    throw new Error(`需要至少提前 ${input.advanceBookingMin} 分钟预约`);
  }

  const amount = Number((durationMin * input.pricePerMinute).toFixed(2));
  return { durationMin, amount };
}

export async function createReservationRecord(
  db: Pool,
  payload: {
    userId: number;
    storeId: number;
    seatId: number;
    startAt: string;
    endAt: string;
    durationMin: number;
    amount: number;
  }
): Promise<{ reservationNo: string }> {
  const reservationNo = `R${Date.now()}${randomUUID().slice(0, 8).toUpperCase()}`;

  await db.execute(
    `INSERT INTO reservations
      (reservation_no, user_id, store_id, seat_id, start_at, end_at, duration_min, order_amount, payable_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment')`,
    [
      reservationNo,
      payload.userId,
      payload.storeId,
      payload.seatId,
      payload.startAt,
      payload.endAt,
      payload.durationMin,
      payload.amount,
      payload.amount
    ]
  );

  return { reservationNo };
}
