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
 */
export const formatCurrency = (number: string | number, currency: string, maxLength = 6): string => {
  const float = Number(number)

  let result = getCurrencyFormatter(currency, false, Math.abs(float) >= 1 || float === 0 ? 0 : 2).format(float)

  // +1 for the currency symbol
  if (result.length > maxLength + 1) {
    result = getCurrencyFormatter(currency, true, 2).format(float)
  }

  return result.replace(/^(\D+)/, '$1 ')
}

export const formatCurrencyPrecise = (number: string | number, currency: string): string => {
  const result = getCurrencyFormatter(currency, false, 2, 2).format(Number(number))
  return result.replace(/^(\D+)/, '$1 ')
}
