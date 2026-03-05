import { useCallback, useMemo } from 'react'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'

const FIAT_DECIMALS = 2

function computeFiatMax(formatted: string, fiatRate: string | undefined): string | undefined {
  const rate = parseFloat(fiatRate ?? '0')
  if (rate <= 0) {
    return undefined
  }
  return (parseFloat(formatted) * rate).toFixed(FIAT_DECIMALS)
}

function getDecimalError(exceedsDecimals: boolean, decimals: number): string | undefined {
  if (!exceedsDecimals) {
    return undefined
  }
  return `Should have 1 to ${decimals} decimals`
}

interface UseMaxAmountArgs {
  maxBalance: string
  decimals: number
  isFiatMode: boolean
  hasFiatPrice: boolean
  fiatRate: string | undefined
  setRawInput: (value: string, maxDecimals: number) => void
  setMax: (value: string) => void
  exceedsDecimals: boolean
}

interface UseMaxAmountResult {
  handleMax: () => void
  handleInputChange: (value: string) => void
  inlineError: string | undefined
}

export function useMaxAmount({
  maxBalance,
  decimals,
  isFiatMode,
  hasFiatPrice,
  fiatRate,
  setRawInput,
  setMax,
  exceedsDecimals,
}: UseMaxAmountArgs): UseMaxAmountResult {
  const inputMaxDecimals = isFiatMode && hasFiatPrice ? FIAT_DECIMALS : decimals

  const handleInputChange = useCallback(
    (value: string) => setRawInput(value, inputMaxDecimals),
    [setRawInput, inputMaxDecimals],
  )

  const handleMax = useCallback(() => {
    const formatted = safeFormatUnits(maxBalance, decimals)
    if (!formatted) {
      return
    }

    if (isFiatMode && hasFiatPrice) {
      const fiatMax = computeFiatMax(formatted, fiatRate)
      setMax(fiatMax ?? formatted)
      return
    }

    setMax(formatted)
  }, [maxBalance, decimals, isFiatMode, hasFiatPrice, fiatRate, setMax])

  const inlineError = useMemo(() => getDecimalError(exceedsDecimals, decimals), [exceedsDecimals, decimals])

  return { handleMax, handleInputChange, inlineError }
}
