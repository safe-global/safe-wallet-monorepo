/**
 * The largest plan a Workspace can buy on its own. Bigger plans (Business 20, Enterprise) are sales-led:
 * "from" pricing and "Talk to us" instead of checkout. PM and GTM own this number.
 */
export const SELF_SERVE_MAX_SEATS = 10

const BUSINESS_SIZES = [5, 10, 20] as const

/** The right-sized Business plan for a Workspace's Safes: 1–5 → 5, 6–10 → 10, 11+ → 20. */
export const recommendSeats = (safeCount: number): (typeof BUSINESS_SIZES)[number] =>
  BUSINESS_SIZES.find((size) => safeCount <= size) ?? 20

export const isSalesLed = (seats: number | null, maxSeats = SELF_SERVE_MAX_SEATS): boolean =>
  seats === null || seats > maxSeats
