import memoize from 'lodash/memoize'

const locale = typeof navigator !== 'undefined' ? navigator.language : undefined

const _getNumberFormatter = (maximumFractionDigits?: number, compact?: boolean) => {
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    maximumFractionDigits,
    notation: compact ? 'compact' : 'standard',
  })
}
const getNumberFormatter = memoize(_getNumberFormatter, (...args: Parameters<typeof _getNumberFormatter>) =>
  args.join(''),
)

const _getCurrencyFormatter = (
  currency: string,
  compact?: boolean,
  maximumFractionDigits?: number,
  minimumFractionDigits?: number,
) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits,
    minimumFractionDigits,
    notation: compact ? 'compact' : 'standard',
  })
}
const getCurrencyFormatter = memoize(_getCurrencyFormatter, (...args: Parameters<typeof _getCurrencyFormatter>) =>
  args.join(''),
)

export const getLocalDecimalSeparator = (): string => {
  const sampleNumber = 1.1
  const numberWithSeparatorFormatted = new Intl.NumberFormat(locale).format(sampleNumber)
  const separator = numberWithSeparatorFormatted.replace(/\p{Number}/gu, '')[0]

  return separator
}

/**
 * Intl.NumberFormat number formatter that adheres to our style guide
 * @param number Number to format
 */
export const formatAmount = (number: string | number, precision = 5, maxLength = 6): string => {
  const float = Number(number)
  if (float === 0) return '0'
  if (float === Math.round(float)) precision = 0
  if (Math.abs(float) < 0.00001) return '< 0.00001'

  const fullNum = getNumberFormatter(precision).format(float)

  // +3 for the decimal point and the two decimal places
  if (fullNum.length <= maxLength + 3) return fullNum

  return getNumberFormatter(2, true).format(float)
}

/**
 * Returns a formatted number with a defined precision not adhering to our style guide compact notation
 * @param number Number to format
 * @param precision Fraction digits to show
 */
export const formatAmountPrecise = (number: string | number, precision?: number): string => {
  return getNumberFormatter(precision).format(Number(number))
}

/**
 * Currency formatter that appends the currency code
 * @param number Number to format
 * @param currency ISO 4217 currency code
 * @param maxLength Maximum length of the formatted string
 * @param mode Formatting mode: 'value' for total balances (always 2 decimals or <$0.01), 'price' for unit prices (adaptive precision)
 */
export const formatCurrency = (
  number: string | number,
  currency: string,
  maxLength = 6,
  mode: 'value' | 'price' = 'price',
): string => {
  const float = Number(number)

  // Value mode: Always 2 decimals for ≥$0.01, <$0.01 threshold, $0.00 for zero
  if (mode === 'value') {
    if (float === 0) {
      const result = getCurrencyFormatter(currency, false, 2, 2).format(0)
      return result.replace(/^(\D+)/, '$1 ')
    }

    if (Math.abs(float) < 0.01) {
      // Get currency symbol for threshold display
      const zeroFormatted = getCurrencyFormatter(currency, false, 2, 2).format(0)
      const currencySymbol = zeroFormatted.match(/^(\D+)/)?.[1] || ''
      const thresholdValue = getCurrencyFormatter(currency, false, 2, 2).format(0.01)
      // Extract just the number part (0.01) from the formatted string, preserving hair space
      const numberPart = thresholdValue.replace(/^(\D+)/, '').trim()
      return `<${currencySymbol} ${numberPart}`
    }

    // Always 2 decimal places for values ≥ $0.01
    const result = getCurrencyFormatter(currency, false, 2, 2).format(float)

    return result.replace(/^(\D+)/, '$1 ')
  }

  // Price mode: Adaptive precision
  // Values ≥ $0.01: 2 decimal places
  // Values $0.0001 - $0.0099: 4-6 decimals (adaptive)
  // Values < $0.0001: 6 decimals or threshold
  let maximumFractionDigits: number
  let minimumFractionDigits: number

  if (float === 0) {
    maximumFractionDigits = 0
    minimumFractionDigits = 0
  } else if (Math.abs(float) >= 0.01) {
    // Values ≥ $0.01: 2 decimal places
    maximumFractionDigits = 2
    minimumFractionDigits = 2
  } else if (Math.abs(float) >= 0.0001) {
    // Values $0.0001 - $0.0099: 4-6 decimals (adaptive based on magnitude)
    // Use more decimals for smaller values
    if (Math.abs(float) >= 0.001) {
      maximumFractionDigits = 4
      minimumFractionDigits = 4
    } else {
      maximumFractionDigits = 6
      minimumFractionDigits = 4
    }
  } else {
    // Values < $0.0001: 6 decimals or threshold
    if (Math.abs(float) < 0.000001) {
      // Extremely small values: show threshold
      const zeroFormatted = getCurrencyFormatter(currency, false, 2, 2).format(0)
      const currencySymbol = zeroFormatted.match(/^(\D+)/)?.[1] || ''
      const thresholdValue = getCurrencyFormatter(currency, false, 6, 6).format(0.000001)
      const numberPart = thresholdValue.replace(/^(\D+)/, '').trim()
      return `<${currencySymbol} ${numberPart}`
    }
    maximumFractionDigits = 6
    minimumFractionDigits = 6
  }

  const result = getCurrencyFormatter(currency, false, maximumFractionDigits, minimumFractionDigits).format(float)

  return result.replace(/^(\D+)/, '$1 ')
}

export const formatCurrencyPrecise = (number: string | number, currency: string): string => {
  const result = getCurrencyFormatter(currency, false, 2, 2).format(Number(number))
  return result.replace(/^(\D+)/, '$1 ')
}

/**
 * Safely compute the ratio `balance / total`.
 *
 * @param balance  The asset’s fiat balance
 * @param total    The overall fiat total
 * @returns A number between 0 and 1.  Returns 0 when the inputs are non-numeric, Infinity, or when total ≤ 0.
 */
export function percentageOfTotal(balance: number | string, total: number | string): number {
  const totalNum = Number(total)
  const balanceNum = Number(balance)

  // invalid, zero or negative totals → return 0 to avoid division by 0/−n
  if (!Number.isFinite(totalNum) || totalNum <= 0) return 0

  // invalid balances → treat as 0 so the overall percentage still works
  if (!Number.isFinite(balanceNum)) return 0

  return balanceNum / totalNum
}
