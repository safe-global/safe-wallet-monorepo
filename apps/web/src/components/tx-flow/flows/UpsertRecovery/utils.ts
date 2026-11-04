import { DAY_IN_SECONDS } from './useRecoveryPeriods'

export const MAX_CUSTOM_DELAY_DAYS = 730
export const MAX_CUSTOM_DELAY_DIGITS = String(MAX_CUSTOM_DELAY_DAYS).length

const isWholeNumber = (value: string) => /^\d+$/.test(value)

export const isCustomDelaySelected = (selectedDelay: string) => {
  return !Number(selectedDelay)
}

export const getDelay = (customDelay: string, selectedDelay: string) => {
  const isCustom = isCustomDelaySelected(selectedDelay)
  if (!isCustom) return selectedDelay
  // BigInt keeps large values out of exponent notation, which BigInt() and the contract encoder reject
  return isWholeNumber(customDelay) ? `${BigInt(customDelay) * BigInt(DAY_IN_SECONDS)}` : ''
}

export const validateCustomDelay = (delay: string): string | undefined => {
  if (!delay) {
    return 'Enter a number of days'
  }
  if (!isWholeNumber(delay)) {
    return 'Invalid number'
  }

  const days = BigInt(delay)
  if (days === BigInt(0)) {
    return 'Invalid number'
  }
  if (days > BigInt(MAX_CUSTOM_DELAY_DAYS)) {
    return `Maximum is ${MAX_CUSTOM_DELAY_DAYS} days`
  }
}
