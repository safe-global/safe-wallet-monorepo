import { renderHook, act } from '@testing-library/react-native'
import { useAmountInput } from './useAmountInput'

describe('useAmountInput', () => {
  const defaultArgs = {
    decimals: 18,
    maxBalance: '1000000000000000000', // 1 ETH in wei
  }

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useAmountInput(defaultArgs))
    expect(result.current.rawInput).toBe('')
    expect(result.current.isZero).toBe(true)
    expect(result.current.isValid).toBe(false)
  })

  it('accepts valid decimal input', () => {
    const { result } = renderHook(() => useAmountInput(defaultArgs))
    act(() => result.current.setRawInput('0.5'))
    expect(result.current.rawInput).toBe('0.5')
    expect(result.current.isValid).toBe(true)
  })

  it('normalizes comma to period', () => {
    const { result } = renderHook(() => useAmountInput(defaultArgs))
    act(() => result.current.setRawInput('0,5'))
    expect(result.current.rawInput).toBe('0.5')
  })

  it('detects exceeds balance', () => {
    const { result } = renderHook(() => useAmountInput(defaultArgs))
    act(() => result.current.setRawInput('2'))
    expect(result.current.exceedsBalance).toBe(true)
    expect(result.current.isValid).toBe(false)
  })

  it('detects exceeds decimals for 6-decimal token', () => {
    const { result } = renderHook(() => useAmountInput({ decimals: 6, maxBalance: '100000000' }))
    act(() => result.current.setRawInput('1.1234567'))
    expect(result.current.exceedsDecimals).toBe(true)
    expect(result.current.isValid).toBe(false)
  })

  it('allows valid decimals for 6-decimal token', () => {
    const { result } = renderHook(() => useAmountInput({ decimals: 6, maxBalance: '100000000' }))
    act(() => result.current.setRawInput('1.123456'))
    expect(result.current.exceedsDecimals).toBe(false)
  })

  it('marks zero input as invalid', () => {
    const { result } = renderHook(() => useAmountInput(defaultArgs))
    act(() => result.current.setRawInput('0'))
    expect(result.current.isZero).toBe(true)
    expect(result.current.isValid).toBe(false)
  })

  it('sets max balance', () => {
    const { result } = renderHook(() => useAmountInput(defaultArgs))
    act(() => result.current.setMax())
    expect(result.current.rawInput).toBe('1')
    expect(result.current.isValid).toBe(true)
  })

  it('sanitizes non-numeric characters', () => {
    const { result } = renderHook(() => useAmountInput(defaultArgs))
    act(() => result.current.setRawInput('abc0.5xyz'))
    expect(result.current.rawInput).toBe('0.5')
  })
})
