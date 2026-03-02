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

  const { tokenAmount, primaryDisplay, secondaryDisplay } = useMemo(() => {
    const display = rawInput || '0'
    const inputNum = rawInput && rawInput !== '.' ? parseFloat(rawInput) : 0
    const validInput = Number.isNaN(inputNum) ? 0 : inputNum

    if (isFiatMode && hasFiatPrice) {
      // Fiat mode: convert fiat input to token amount
      let token = ''
      if (rawInput && validInput > 0 && rate > 0) {
        const raw = (validInput / rate).toString()
        token = truncateToDecimals(raw, decimals)
      }

      return {
        tokenAmount: token,
        primaryDisplay: `${currencySymbol} ${display}`,
        secondaryDisplay: token ? `${token} ${symbol}` : `0 ${symbol}`,
      }
    }

    // Token mode (or no fiat price available)
    const fiatDisplay = hasFiatPrice ? formatCurrency((validInput * rate).toString(), currency) : ''

    return {
      tokenAmount: rawInput,
      primaryDisplay: `${display} ${symbol}`,
      secondaryDisplay: fiatDisplay,
    }
  }, [rawInput, isFiatMode, hasFiatPrice, rate, decimals, currency, currencySymbol, symbol])

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
