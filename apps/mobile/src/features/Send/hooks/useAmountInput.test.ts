import { renderHook, act } from '@testing-library/react-native'
import { useAmountInput, useTokenAmountValidation } from './useAmountInput'

describe('useAmountInput', () => {
  it('initializes with empty state', () => {
    const { result } = renderHook(() => useAmountInput())
    expect(result.current.rawInput).toBe('')
  })

  it('accepts valid decimal input', () => {
    const { result } = renderHook(() => useAmountInput())
    act(() => result.current.setRawInput('0.5', 18))
    expect(result.current.rawInput).toBe('0.5')
  })

  it('normalizes comma to period', () => {
    const { result } = renderHook(() => useAmountInput())
    act(() => result.current.setRawInput('0,5', 18))
    expect(result.current.rawInput).toBe('0.5')
  })

  it('sanitizes non-numeric characters', () => {
    const { result } = renderHook(() => useAmountInput())
    act(() => result.current.setRawInput('abc0.5xyz', 18))
    expect(result.current.rawInput).toBe('0.5')
  })

  it('sets max value directly', () => {
    const { result } = renderHook(() => useAmountInput())
    act(() => result.current.setMax('1.5'))
    expect(result.current.rawInput).toBe('1.5')
  })

  it('rejects input exceeding maxDecimals', () => {
    const { result } = renderHook(() => useAmountInput())
    act(() => result.current.setRawInput('1.123', 2))
    expect(result.current.rawInput).toBe('')
  })

  it('allows input within maxDecimals', () => {
    const { result } = renderHook(() => useAmountInput())
    act(() => result.current.setRawInput('1.12', 2))
    expect(result.current.rawInput).toBe('1.12')
  })

  it('enforces 6-decimal limit for USDC-like tokens', () => {
    const { result } = renderHook(() => useAmountInput())
    act(() => result.current.setRawInput('1.123456', 6))
    expect(result.current.rawInput).toBe('1.123456')
    act(() => result.current.setRawInput('1.1234567', 6))
    // Rejected — rawInput stays at previous value
    expect(result.current.rawInput).toBe('1.123456')
  })
})

describe('useTokenAmountValidation', () => {
  const defaultArgs = {
    tokenAmount: '',
    decimals: 18,
    maxBalance: '1000000000000000000', // 1 ETH in wei
  }

  it('marks empty input as zero and invalid', () => {
    const { result } = renderHook(() => useTokenAmountValidation(defaultArgs))
    expect(result.current.isZero).toBe(true)
    expect(result.current.isValid).toBe(false)
  })

  it('validates a valid amount', () => {
    const { result } = renderHook(() => useTokenAmountValidation({ ...defaultArgs, tokenAmount: '0.5' }))
    expect(result.current.isValid).toBe(true)
    expect(result.current.exceedsBalance).toBe(false)
  })

  it('detects exceeds balance', () => {
    const { result } = renderHook(() => useTokenAmountValidation({ ...defaultArgs, tokenAmount: '2' }))
    expect(result.current.exceedsBalance).toBe(true)
    expect(result.current.isValid).toBe(false)
  })

  it('detects exceeds decimals for 6-decimal token', () => {
    const { result } = renderHook(() =>
      useTokenAmountValidation({
        tokenAmount: '1.1234567',
        decimals: 6,
        maxBalance: '100000000',
      }),
    )
    expect(result.current.exceedsDecimals).toBe(true)
    expect(result.current.isValid).toBe(false)
  })

  it('allows valid decimals for 6-decimal token', () => {
    const { result } = renderHook(() =>
      useTokenAmountValidation({
        tokenAmount: '1.123456',
        decimals: 6,
        maxBalance: '100000000',
      }),
    )
    expect(result.current.exceedsDecimals).toBe(false)
  })

  it('marks zero input as invalid', () => {
    const { result } = renderHook(() => useTokenAmountValidation({ ...defaultArgs, tokenAmount: '0' }))
    expect(result.current.isZero).toBe(true)
    expect(result.current.isValid).toBe(false)
  })
})
