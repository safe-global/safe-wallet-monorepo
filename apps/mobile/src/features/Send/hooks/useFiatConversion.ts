import { useMemo, useState } from 'react'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'

interface UseFiatConversionArgs {
  amount: string
  fiatConversion: string | undefined
  currency: string
  symbol: string
}

interface UseFiatConversionResult {
  primaryDisplay: string
  secondaryDisplay: string
  isFiatMode: boolean
  toggleMode: () => void
  hasFiatPrice: boolean
}

export function useFiatConversion({
  amount,
  fiatConversion,
  currency,
  symbol,
}: UseFiatConversionArgs): UseFiatConversionResult {
  const [isFiatMode, setIsFiatMode] = useState(true)

  const hasFiatPrice = !!fiatConversion && parseFloat(fiatConversion) > 0

  const fiatValue = useMemo(() => {
    if (!amount || !fiatConversion) {
      return undefined
    }
    const numAmount = parseFloat(amount)
    if (Number.isNaN(numAmount)) {
      return undefined
    }
    return (numAmount * parseFloat(fiatConversion)).toString()
  }, [amount, fiatConversion])

  const formattedFiat = useMemo(() => {
    if (!fiatValue) {
      return ''
    }
    return formatCurrency(fiatValue, currency)
  }, [fiatValue, currency])

  const tokenDisplay = amount ? `${amount} ${symbol}` : `0 ${symbol}`

  const primaryDisplay = isFiatMode && hasFiatPrice ? formattedFiat : tokenDisplay
  const secondaryDisplay = isFiatMode && hasFiatPrice ? tokenDisplay : formattedFiat

  const toggleMode = () => {
    if (hasFiatPrice) {
      setIsFiatMode((prev) => !prev)
    }
  }

  return {
    primaryDisplay,
    secondaryDisplay,
    isFiatMode,
    toggleMode,
    hasFiatPrice,
  }
}
