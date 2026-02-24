export type ReservationQuoteInput = {
  startAt: string;
  endAt: string;
  pricePerMinute: number;
  minDurationMin: number;
  advanceBookingMin: number;
};

export type ReservationQuoteResult = {
  durationMin: number;
  amount: number;
};
