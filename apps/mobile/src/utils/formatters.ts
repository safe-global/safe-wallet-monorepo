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

const calculateRatio = (a: Quantity, b: Quantity) => {
  if (BigInt(b.amount) === 0n) {
    return 0
  }
  return asDecimal(BigInt(a.amount), a.decimals) / asDecimal(BigInt(b.amount), b.decimals)
}

/**
 * Formats a fiat amount with appropriate scaling (k, M, B) and consistent decimal places
 *
 * @param amount - String representation of a number (can include commas)
 * @param options - Optional formatting configuration
 * @returns Formatted string value
 *
 * Examples:
 * formatFiatAmount("1234.56") => "1.23k"
 * formatFiatAmount("422838.89") => "422.84k"
 * formatFiatAmount("1000000") => "1.00M"
 */
export const formatFiatAmount = (
  amount: string,
  options: {
    decimalPlaces?: number
    threshold?: number
    addSymbol?: boolean
    currencySymbol?: string
  } = {},
): string => {
  const { decimalPlaces = 2, threshold = 1000, addSymbol = false, currencySymbol = '' } = options

  const numericValue = parseFloat(amount.replace(/,/g, ''))

  if (isNaN(numericValue)) {
    return amount
  }

  let formattedValue: string
  if (numericValue >= 1_000_000_000) {
    // Billions
    formattedValue = `${(numericValue / 1_000_000_000).toFixed(decimalPlaces)}B`
  } else if (numericValue >= 1_000_000) {
    // Millions
    formattedValue = `${(numericValue / 1_000_000).toFixed(decimalPlaces)}M`
  } else if (numericValue >= threshold) {
    // Thousands
    formattedValue = `${(numericValue / 1_000).toFixed(decimalPlaces)}k`
  } else {
    // Regular numbers
    formattedValue = numericValue.toFixed(decimalPlaces)
  }

  // Add currency symbol if requested
  return addSymbol ? `${currencySymbol}${formattedValue}` : formattedValue
}
