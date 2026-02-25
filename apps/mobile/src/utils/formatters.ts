import { SwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { formatUnits } from 'ethers'

type Quantity = {
  amount: string | number | bigint
  decimals: number
}

function asDecimal(amount: number | bigint, decimals: number): number {
  return Number(formatUnits(amount, decimals))
}

export const ellipsis = (str: string, length: number): string => {
  return str.length > length ? `${str.slice(0, length)}...` : str
}

export const makeSafeId = (chainId: string, address: string) => `${chainId}:${address}` as `${number}:0x${string}`

export const shortenAddress = (address: string, length = 4): string => {
  if (!address) {
    return ''
  }

  return `${address.slice(0, length + 2)}...${address.slice(-length)}`
}

export const formatValue = (value: string, decimals: number): string => {
  return (parseInt(value) / 10 ** decimals).toString().substring(0, 8)
}

export const getLimitPrice = (
  order: Pick<SwapOrderTransactionInfo, 'sellAmount' | 'buyAmount' | 'buyToken' | 'sellToken'>,
): number => {
  const { sellAmount, buyAmount, buyToken, sellToken } = order

  const ratio = calculateRatio(
    { amount: sellAmount, decimals: sellToken.decimals },
    { amount: buyAmount, decimals: buyToken.decimals },
  )

  return ratio
}

// Sanitize input to allow only numbers and decimal point
export const sanitizeDecimalInput = (value: string) => {
  // Normalize comma to period for locale compatibility
  let sanitized = value.replace(/,/g, '.')
  // Remove all characters except digits and decimal point
  sanitized = sanitized.replace(/[^\d.]/g, '')
  // Ensure only one decimal point
  const parts = sanitized.split('.')
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('')
  }
  // Prefix leading dot with zero: "." → "0."
  if (sanitized.startsWith('.')) {
    sanitized = '0' + sanitized
  }
  // Strip leading zeros: "05" → "5", but keep "0" and "0."
  if (
    sanitized.length > 1 &&
    sanitized.startsWith('0') &&
    sanitized[1] !== '.'
  ) {
    sanitized = sanitized.replace(/^0+/, '') || '0'
  }
  return sanitized
}

// Sanitize input to allow only integers (no decimal point)
export const sanitizeIntegerInput = (value: string) => {
  // Remove all characters except digits
  return value.replace(/\D/g, '')
}

const calculateRatio = (a: Quantity, b: Quantity) => {
  if (BigInt(b.amount) === 0n) {
    return 0
  }
  return asDecimal(BigInt(a.amount), a.decimals) / asDecimal(BigInt(b.amount), b.decimals)
}

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

interface CurrencyParts {
  symbol: string
  whole: string
  decimals: string
  endCurrency: string
}

/**
 * Split a formatted currency string (e.g. "$ 380.52" or "380,52 €") into
 * parts so the decimal portion can be styled independently.
 *
 * Uses [.,]\d+ to match the decimal separator, which handles both "." (en)
 * and "," (de/fr) locales since Intl.NumberFormat uses the device locale.
 */
export const splitCurrencyParts = (formatted: string): CurrencyParts => {
  const match = formatted.match(/^(\D+)?(.+)([.,]\d+)(\D+)?$/)

  if (!match) {
    return { symbol: '', whole: formatted, decimals: '', endCurrency: '' }
  }

  return {
    symbol: match[1] ?? '',
    whole: match[2],
    decimals: match[3],
    endCurrency: match[4] ?? '',
  }
}
