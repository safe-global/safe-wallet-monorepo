import { TOTP_INTERVAL_SECONDS } from '@/features/proposers/constants'

/**
 * Returns the current TOTP value (hour-based).
 * The delegate API uses totp = floor(now / 3600) as a time-based nonce.
 */
export const getCurrentTotp = (): number => {
  return Math.floor(Date.now() / 1000 / TOTP_INTERVAL_SECONDS)
}

/**
 * Checks if a TOTP value from a delegation message is still valid.
 * The backend accepts current TOTP ± 1 previous interval (~2 hour window).
 */
export const isTotpValid = (messageTotp: number): boolean => {
  const currentTotp = getCurrentTotp()
  return currentTotp - messageTotp <= 1
}

/**
 * Computes the expiration date for a TOTP-based delegation.
 * The TOTP is valid for current interval + 1 previous interval.
 * So expiration is at (totp + 2) intervals from the epoch.
 */
export const getTotpExpirationDate = (totp: number): Date => {
  return new Date((totp + 2) * TOTP_INTERVAL_SECONDS * 1000)
}
