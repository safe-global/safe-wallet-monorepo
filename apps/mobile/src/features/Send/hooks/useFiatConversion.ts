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

/** Returns the narrow currency symbol for a given ISO 4217 code. */
export const getCurrencySymbol = (currency: string): string => {
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
 * Truncate a numeric string to at most `maxDecimals` decimal
 * places. This always rounds DOWN (floors) - no rounding up.
 */
export const truncateToDecimals = (value: string, maxDecimals: number): string => {
  const dotIndex = value.indexOf('.')
  if (dotIndex === -1) {
    return value
  }
  return value.slice(0, dotIndex + 1 + maxDecimals)
}

/** Parse a raw string input into a safe numeric value. */
const parseInput = (rawInput: string): number => {
  if (!rawInput || rawInput === '.') {
    return 0
  }
  const num = parseFloat(rawInput)
  return Number.isNaN(num) ? 0 : num
}

/** Convert a fiat value to a token amount string. */
const fiatToToken = (validInput: number, rate: number, maxDecimals: number): string => {
  if (validInput <= 0 || rate <= 0) {
    return ''
  }
  const raw = (validInput / rate).toFixed(maxDecimals).replace(/\.?0+$/, '')
  return truncateToDecimals(raw, maxDecimals)
}

interface DisplayResult {
  tokenAmount: string
  primaryDisplay: string
  secondaryDisplay: string
}

interface BuildFiatDisplayArgs {
  rawInput: string
  validInput: number
  rate: number
  decimals: number
  currencySymbol: string
  symbol: string
}

/** Build display strings for fiat-input mode. */
const buildFiatDisplay = ({
  rawInput,
  validInput,
  rate,
  decimals,
  currencySymbol,
  symbol,
}: BuildFiatDisplayArgs): DisplayResult => {
  const display = rawInput || '0'
  const token = fiatToToken(validInput, rate, decimals)
  return {
    tokenAmount: token,
    primaryDisplay: `${currencySymbol} ${display}`,
    secondaryDisplay: token ? `${token} ${symbol}` : `0 ${symbol}`,
  }
}

interface BuildTokenDisplayArgs {
  rawInput: string
  validInput: number
  rate: number
  hasFiatPrice: boolean
  currency: string
  symbol: string
}

/** Build display strings for token-input mode. */
const buildTokenDisplay = ({
  rawInput,
  validInput,
  rate,
  hasFiatPrice,
  currency,
  symbol,
}: BuildTokenDisplayArgs): DisplayResult => {
  const display = rawInput || '0'
  const fiatDisplay = hasFiatPrice ? formatCurrency((validInput * rate).toString(), currency) : ''
  return {
    tokenAmount: rawInput,
    primaryDisplay: `${display} ${symbol}`,
    secondaryDisplay: fiatDisplay,
  }
}

export function useFiatConversion({
  rawInput,
  fiatRate,
  currency,
  symbol,
  decimals,
}: UseFiatConversionArgs): UseFiatConversionResult {
  const [isFiatMode, setIsFiatMode] = useState(true)

  const rate = fiatRate ? parseFloat(fiatRate) : 0
  const hasFiatPrice = rate > 0

  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency])

  const result = useMemo(() => {
    const validInput = parseInput(rawInput)

    if (isFiatMode && hasFiatPrice) {
      return buildFiatDisplay({ rawInput, validInput, rate, decimals, currencySymbol, symbol })
    }

    return buildTokenDisplay({ rawInput, validInput, rate, hasFiatPrice, currency, symbol })
  }, [rawInput, isFiatMode, hasFiatPrice, rate, decimals, currency, currencySymbol, symbol])

  const toggleMode = useCallback(() => {
    if (hasFiatPrice) {
      setIsFiatMode((prev) => !prev)
    }
  }, [hasFiatPrice])

  return {
    ...result,
    isFiatMode,
    toggleMode,
    hasFiatPrice,
  }
}
