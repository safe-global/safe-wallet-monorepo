import { useCallback, useMemo, useState } from 'react'
import { safeParseUnits, safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { sanitizeDecimalInput } from '@/src/utils/formatters'

interface UseAmountInputResult {
  rawInput: string
  setRawInput: (value: string, maxDecimals: number) => void
  setMax: (value: string) => void
}

const getDecimalCount = (value: string): number => {
  const dotIndex = value.indexOf('.')
  if (dotIndex === -1) {
    return 0
  }
  return value.length - dotIndex - 1
}

/**
 * Manages the raw text input state with sanitization.
 * Decimal enforcement is done per-keystroke via setRawInput's
 * maxDecimals parameter.
 */
export function useAmountInput(): UseAmountInputResult {
  const [rawInput, setRawInputState] = useState('')

  const setRawInput = useCallback((value: string, maxDecimals: number) => {
    const sanitized = sanitizeDecimalInput(value)
    if (getDecimalCount(sanitized) > maxDecimals) {
      return
    }
    setRawInputState(sanitized)
  }, [])

  const setMax = useCallback((value: string) => {
    setRawInputState(value)
  }, [])

  return { rawInput, setRawInput, setMax }
}

const validateDecimalLength = (value: string, maxDecimals: number): boolean => {
  const parts = value.split('.')
  if (parts.length < 2) {
    return true
  }
  return parts[1].length <= maxDecimals
}

/**
 * Validates a token amount against decimals and balance constraints.
 * `tokenAmount` must always be in token units (not fiat).
 */
export function useTokenAmountValidation({
  tokenAmount,
  decimals,
  maxBalance,
}: {
  tokenAmount: string
  decimals: number
  maxBalance: string
}) {
  const isZero = useMemo(() => {
    if (!tokenAmount) {
      return true
    }
    const parsed = parseFloat(tokenAmount)
    return parsed === 0 || Number.isNaN(parsed)
  }, [tokenAmount])

  const exceedsDecimals = useMemo(() => {
    if (!tokenAmount) {
      return false
    }
    return !validateDecimalLength(tokenAmount, decimals)
  }, [tokenAmount, decimals])

  const exceedsBalance = useMemo(() => {
    if (!tokenAmount || isZero || exceedsDecimals) {
      return false
    }
    const inputWei = safeParseUnits(tokenAmount, decimals)
    if (inputWei === undefined) {
      return false
    }
    const formatted = safeFormatUnits(maxBalance, decimals) ?? '0'
    const balanceWei = safeParseUnits(formatted, decimals)
    if (balanceWei === undefined) {
      return false
    }
    return inputWei > balanceWei
  }, [tokenAmount, decimals, maxBalance, isZero, exceedsDecimals])

  const isValid = useMemo(() => {
    return !!tokenAmount && !isZero && !exceedsBalance && !exceedsDecimals
  }, [tokenAmount, isZero, exceedsBalance, exceedsDecimals])

  return { isZero, exceedsBalance, exceedsDecimals, isValid }
}
