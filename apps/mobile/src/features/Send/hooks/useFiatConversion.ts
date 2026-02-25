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

export function useFiatConversion({
  rawInput,
  fiatRate,
  currency,
  symbol,
  decimals,
}: UseFiatConversionArgs): UseFiatConversionResult {
  const [isFiatMode, setIsFiatMode] = useState(true)

  const hasFiatPrice = !!fiatRate && parseFloat(fiatRate) > 0
  const rate = hasFiatPrice ? parseFloat(fiatRate) : 0

  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency])

  const tokenAmount = useMemo(() => {
    if (!rawInput) {
      return ''
    }
    if (isFiatMode && hasFiatPrice) {
      const fiatNum = safeParseFloat(rawInput)
      if (fiatNum === 0 || rate === 0) {
        return ''
      }
      return truncateDecimals((fiatNum / rate).toString(), decimals)
    }
    return rawInput
  }, [rawInput, isFiatMode, hasFiatPrice, rate, decimals])

  // Derived fiat value (for secondary display in token mode)
  const derivedFiat = useMemo(() => {
    if (!hasFiatPrice) {
      return ''
    }
    if (isFiatMode) {
      return ''
    }
    const tokenNum = safeParseFloat(rawInput)
    return formatCurrency((tokenNum * rate).toString(), currency)
  }, [rawInput, isFiatMode, hasFiatPrice, rate, currency])

  // Derived token value (for secondary display in fiat mode)
  const derivedToken = useMemo(() => {
    if (!isFiatMode || !hasFiatPrice) {
      return ''
    }
    const t = tokenAmount || '0'
    return `${t} ${symbol}`
  }, [isFiatMode, hasFiatPrice, tokenAmount, symbol])

  // Primary: show exactly what the user is typing with the right prefix
  const primaryDisplay = useMemo(() => {
    const display = rawInput || '0'
    if (isFiatMode && hasFiatPrice) {
      return `${currencySymbol} ${display}`
    }
    return `${display} ${symbol}`
  }, [rawInput, isFiatMode, hasFiatPrice, currencySymbol, symbol])

  // Secondary: show the derived conversion
  const secondaryDisplay = useMemo(() => {
    if (isFiatMode && hasFiatPrice) {
      return derivedToken
    }
    return derivedFiat
  }, [isFiatMode, hasFiatPrice, derivedToken, derivedFiat])

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
