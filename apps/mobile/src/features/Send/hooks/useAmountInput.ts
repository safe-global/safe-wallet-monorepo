import { useCallback, useMemo, useState } from 'react'
import { safeParseUnits, safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { sanitizeDecimalInput } from '@/src/utils/formatters'

interface UseAmountInputArgs {
  decimals: number
  maxBalance: string
}

interface UseAmountInputResult {
  rawInput: string
  normalizedAmount: string
  setRawInput: (value: string) => void
  setMax: () => void
  isZero: boolean
  exceedsBalance: boolean
  exceedsDecimals: boolean
  isValid: boolean
}

const validateDecimalLength = (value: string, maxDecimals: number): boolean => {
  const parts = value.split('.')
  if (parts.length < 2) {
    return true
  }
  return parts[1].length <= maxDecimals
}

export function useAmountInput({ decimals, maxBalance }: UseAmountInputArgs): UseAmountInputResult {
  const [rawInput, setRawInputState] = useState('')

  const setRawInput = useCallback((value: string) => {
    const sanitized = sanitizeDecimalInput(value)
    setRawInputState(sanitized)
  }, [])

  const normalizedAmount = useMemo(() => {
    if (!rawInput) {
      return ''
    }
    return rawInput
  }, [rawInput])

  const isZero = useMemo(() => {
    if (!normalizedAmount) {
      return true
    }
    const parsed = parseFloat(normalizedAmount)
    return parsed === 0 || Number.isNaN(parsed)
  }, [normalizedAmount])

  const exceedsDecimals = useMemo(() => {
    if (!normalizedAmount) {
      return false
    }
    return !validateDecimalLength(normalizedAmount, decimals)
  }, [normalizedAmount, decimals])

  const exceedsBalance = useMemo(() => {
    if (!normalizedAmount || isZero || exceedsDecimals) {
      return false
    }
    const inputWei = safeParseUnits(normalizedAmount, decimals)
    if (inputWei === undefined) {
      return false
    }
    const balanceWei = safeParseUnits(safeFormatUnits(maxBalance, decimals) ?? '0', decimals)
    if (balanceWei === undefined) {
      return false
    }
    return inputWei > balanceWei
  }, [normalizedAmount, decimals, maxBalance, isZero, exceedsDecimals])

  const isValid = useMemo(() => {
    return !!normalizedAmount && !isZero && !exceedsBalance && !exceedsDecimals
  }, [normalizedAmount, isZero, exceedsBalance, exceedsDecimals])

  const setMax = useCallback(() => {
    const formatted = safeFormatUnits(maxBalance, decimals)
    if (formatted) {
      setRawInputState(formatted)
    }
  }, [maxBalance, decimals])

  return {
    rawInput,
    normalizedAmount,
    setRawInput,
    setMax,
    isZero,
    exceedsBalance,
    exceedsDecimals,
    isValid,
  }
}
