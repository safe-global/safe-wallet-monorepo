import { useCallback, useMemo, useState } from 'react'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'

interface UseFiatConversionArgs {
  rawInput: string
  fiatRate: string | undefined
  currency: string
  symbol: string
  decimals: number
}

interface UseFiatConversionResult {
  /** Token amount derived from user input (always in token units) */
  tokenAmount: string
  primaryDisplay: string
  secondaryDisplay: string
  isFiatMode: boolean
  toggleMode: () => void
  hasFiatPrice: boolean
}

/** Returns the currency symbol for a given currency code. */
const getCurrencySymbol = (currency: string): string => {
  try {
    return (
      new Intl.NumberFormat('en', {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
      })
        .formatToParts(0)
        .find((p) => p.type === 'currency')?.value ?? currency
    )
  } catch {
    return currency
  }
}

/**
 * Parse a raw string as a number, treating partial
 * decimals like "." or "" as 0.
 */
const safeParseFloat = (value: string): number => {
  if (!value || value === '.') {
    return 0
  }
  const n = parseFloat(value)
  return Number.isNaN(n) ? 0 : n
}

/** Truncate a numeric string to at most `maxDecimals` decimal places. */
const truncateDecimals = (value: string, maxDecimals: number): string => {
  const dotIndex = value.indexOf('.')
  if (dotIndex === -1) {
    return value
  }
  return value.slice(0, dotIndex + 1 + maxDecimals)
}

const parseRate = (fiatRate: string | undefined): { hasFiatPrice: boolean; rate: number } => {
  const rate = fiatRate ? parseFloat(fiatRate) : 0
  return { hasFiatPrice: rate > 0, rate }
}

const computeTokenAmount = (
  rawInput: string,
  isFiatMode: boolean,
  hasFiatPrice: boolean,
  rate: number,
  decimals: number,
): string => {
  if (!rawInput) {
    return ''
  }
  if (!isFiatMode || !hasFiatPrice) {
    return rawInput
  }

  const fiatNum = safeParseFloat(rawInput)
  if (fiatNum === 0 || rate === 0) {
    return ''
  }

  return truncateDecimals((fiatNum / rate).toString(), decimals)
}

const computeDerivedFiat = (
  rawInput: string,
  isFiatMode: boolean,
  hasFiatPrice: boolean,
  rate: number,
  currency: string,
): string => {
  if (isFiatMode || !hasFiatPrice) {
    return ''
  }

  const tokenNum = safeParseFloat(rawInput)
  return formatCurrency((tokenNum * rate).toString(), currency)
}

const computeDerivedToken = (
  isFiatMode: boolean,
  hasFiatPrice: boolean,
  tokenAmount: string,
  symbol: string,
): string => {
  if (!isFiatMode || !hasFiatPrice) {
    return ''
  }
  return `${tokenAmount || '0'} ${symbol}`
}

const formatPrimaryDisplay = (
  rawInput: string,
  isFiatMode: boolean,
  hasFiatPrice: boolean,
  currencySymbol: string,
  symbol: string,
): string => {
  const display = rawInput || '0'
  if (isFiatMode && hasFiatPrice) {
    return `${currencySymbol} ${display}`
  }
  return `${display} ${symbol}`
}

export function useFiatConversion({
  rawInput,
  fiatRate,
  currency,
  symbol,
  decimals,
}: UseFiatConversionArgs): UseFiatConversionResult {
  const [isFiatMode, setIsFiatMode] = useState(true)

  const { hasFiatPrice, rate } = parseRate(fiatRate)

  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency])

  const tokenAmount = useMemo(
    () => computeTokenAmount(rawInput, isFiatMode, hasFiatPrice, rate, decimals),
    [rawInput, isFiatMode, hasFiatPrice, rate, decimals],
  )

  const derivedFiat = useMemo(
    () => computeDerivedFiat(rawInput, isFiatMode, hasFiatPrice, rate, currency),
    [rawInput, isFiatMode, hasFiatPrice, rate, currency],
  )

  const derivedToken = useMemo(
    () => computeDerivedToken(isFiatMode, hasFiatPrice, tokenAmount, symbol),
    [isFiatMode, hasFiatPrice, tokenAmount, symbol],
  )

  const primaryDisplay = useMemo(
    () => formatPrimaryDisplay(rawInput, isFiatMode, hasFiatPrice, currencySymbol, symbol),
    [rawInput, isFiatMode, hasFiatPrice, currencySymbol, symbol],
  )

  const secondaryDisplay = useMemo(
    () => (isFiatMode && hasFiatPrice ? derivedToken : derivedFiat),
    [isFiatMode, hasFiatPrice, derivedToken, derivedFiat],
  )

  const toggleMode = useCallback(() => {
    if (hasFiatPrice) {
      setIsFiatMode((prev) => !prev)
    }
  }, [hasFiatPrice])

  return {
    tokenAmount,
    primaryDisplay,
    secondaryDisplay,
    isFiatMode,
    toggleMode,
    hasFiatPrice,
  }
}
