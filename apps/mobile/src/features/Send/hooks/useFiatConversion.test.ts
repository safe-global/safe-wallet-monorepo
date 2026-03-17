import { renderHook, act } from '@testing-library/react-native'
import { useFiatConversion, getCurrencySymbol, truncateToDecimals } from './useFiatConversion'

// Mock formatCurrency to keep tests focused on this hook's logic
jest.mock('@safe-global/utils/utils/formatNumber', () => ({
  formatCurrencyPrecise: (value: string, currency: string) => `${currency} ${value}`,
}))

describe('getCurrencySymbol', () => {
  it('returns $ for USD', () => {
    expect(getCurrencySymbol('USD')).toBe('$')
  })

  it('returns the currency code for unknown currencies', () => {
    expect(getCurrencySymbol('FAKE')).toBe('FAKE')
  })
})

describe('truncateToDecimals', () => {
  it('returns the value unchanged when no decimal point', () => {
    expect(truncateToDecimals('123', 6)).toBe('123')
  })

  it('truncates to the specified number of decimals', () => {
    expect(truncateToDecimals('1.123456789', 6)).toBe('1.123456')
  })

  it('does not pad when fewer decimals than max', () => {
    expect(truncateToDecimals('1.12', 6)).toBe('1.12')
  })

  it('truncates to zero decimals', () => {
    expect(truncateToDecimals('1.999', 0)).toBe('1.')
  })

  it('always truncates down, never rounds up', () => {
    // 1.999999 truncated to 2 decimals should be 1.99, not 2.00
    expect(truncateToDecimals('1.999999', 2)).toBe('1.99')
  })
})

describe('useFiatConversion', () => {
  const mockOnRawInputChange = jest.fn()

  beforeEach(() => {
    mockOnRawInputChange.mockClear()
  })

  const defaultArgs = {
    rawInput: '',
    fiatRate: '2000',
    currency: 'USD',
    symbol: 'ETH',
    decimals: 18,
    onRawInputChange: mockOnRawInputChange,
  }

  describe('initialization', () => {
    it('starts in fiat mode when fiat price is available', () => {
      const { result } = renderHook(() => useFiatConversion(defaultArgs))
      expect(result.current.isFiatMode).toBe(true)
      expect(result.current.hasFiatPrice).toBe(true)
    })

    it('returns empty tokenAmount for empty input', () => {
      const { result } = renderHook(() => useFiatConversion(defaultArgs))
      expect(result.current.tokenAmount).toBe('')
    })
  })

  describe('fiat mode (fiat -> token conversion)', () => {
    it('converts fiat input to token amount', () => {
      const { result } = renderHook(() => useFiatConversion({ ...defaultArgs, rawInput: '2000' }))
      // 2000 / 2000 = 1
      expect(result.current.tokenAmount).toBe('1')
    })

    it('shows fiat value as primary display', () => {
      const { result } = renderHook(() => useFiatConversion({ ...defaultArgs, rawInput: '100' }))
      expect(result.current.primaryDisplay).toBe('$ 100')
    })

    it('shows token equivalent as secondary display', () => {
      const { result } = renderHook(() => useFiatConversion({ ...defaultArgs, rawInput: '2000' }))
      expect(result.current.secondaryDisplay).toBe('1 ETH')
    })

    it('returns empty tokenAmount for zero input', () => {
      const { result } = renderHook(() => useFiatConversion({ ...defaultArgs, rawInput: '0' }))
      expect(result.current.tokenAmount).toBe('')
    })

    it('returns empty tokenAmount for dot-only input', () => {
      const { result } = renderHook(() => useFiatConversion({ ...defaultArgs, rawInput: '.' }))
      expect(result.current.tokenAmount).toBe('')
    })

    it('truncates token amount to token decimals (floors, never rounds)', () => {
      // 1 / 3 = 0.333333... should be truncated to 6 decimals
      const { result } = renderHook(() =>
        useFiatConversion({
          ...defaultArgs,
          rawInput: '1',
          fiatRate: '3',
          decimals: 6,
        }),
      )
      expect(result.current.tokenAmount).toBe('0.333333')
    })
  })

  describe('token mode (token -> fiat conversion)', () => {
    it('passes rawInput through as tokenAmount', () => {
      const { result } = renderHook(() => useFiatConversion({ ...defaultArgs, rawInput: '1.5' }))
      // Toggle to token mode
      act(() => result.current.toggleMode())
      expect(result.current.tokenAmount).toBe('1.5')
    })

    it('shows token value as primary display', () => {
      const { result } = renderHook(() => useFiatConversion({ ...defaultArgs, rawInput: '1.5' }))
      act(() => result.current.toggleMode())
      expect(result.current.primaryDisplay).toBe('1.5 ETH')
    })

    it('shows fiat equivalent as secondary display', () => {
      const { result } = renderHook(() => useFiatConversion({ ...defaultArgs, rawInput: '1.5' }))
      act(() => result.current.toggleMode())
      // 1.5 * 2000 = 3000, mocked formatCurrency returns "USD 3000"
      expect(result.current.secondaryDisplay).toBe('USD 3000')
    })

    it('shows 0 for empty input primary display', () => {
      const { result } = renderHook(() => useFiatConversion({ ...defaultArgs, rawInput: '' }))
      act(() => result.current.toggleMode())
      expect(result.current.primaryDisplay).toBe('0 ETH')
    })
  })

  describe('toggle mode', () => {
    it('toggles between fiat and token mode', () => {
      const { result } = renderHook(() => useFiatConversion(defaultArgs))
      expect(result.current.isFiatMode).toBe(true)
      act(() => result.current.toggleMode())
      expect(result.current.isFiatMode).toBe(false)
      act(() => result.current.toggleMode())
      expect(result.current.isFiatMode).toBe(true)
    })

    it('does not toggle when no fiat price', () => {
      const { result } = renderHook(() => useFiatConversion({ ...defaultArgs, fiatRate: undefined }))
      expect(result.current.isFiatMode).toBe(true)
      act(() => result.current.toggleMode())
      // Should remain the same since hasFiatPrice is false
      expect(result.current.isFiatMode).toBe(true)
    })

    it('converts fiat to token value when toggling from fiat to token mode', () => {
      const { result } = renderHook(() => useFiatConversion({ ...defaultArgs, rawInput: '2000' }))
      act(() => result.current.toggleMode())
      // 2000 USD / 2000 rate = 1 ETH
      expect(mockOnRawInputChange).toHaveBeenCalledWith('1')
    })

    it('converts token to fiat value when toggling from token to fiat mode', () => {
      // Start in token mode by toggling first with empty input
      const { result, rerender } = renderHook(({ args }) => useFiatConversion(args), {
        initialProps: { args: { ...defaultArgs, rawInput: '' } },
      })
      act(() => result.current.toggleMode())
      mockOnRawInputChange.mockClear()

      // Now in token mode with rawInput '1.5'
      rerender({ args: { ...defaultArgs, rawInput: '1.5' } })
      act(() => result.current.toggleMode())
      // 1.5 ETH * 2000 rate = 3000 USD
      expect(mockOnRawInputChange).toHaveBeenCalledWith('3000')
    })

    it('produces fixed-point fiat string for very small token amounts (no scientific notation)', () => {
      const { result, rerender } = renderHook(({ args }) => useFiatConversion(args), {
        initialProps: { args: { ...defaultArgs, rawInput: '' } },
      })
      act(() => result.current.toggleMode())
      mockOnRawInputChange.mockClear()

      // Very small token amount: 0.000000000000000001 ETH * 2000 = 2e-15
      rerender({ args: { ...defaultArgs, rawInput: '0.000000000000000001' } })
      act(() => result.current.toggleMode())
      // Should produce empty string (rounds to 0.00 at 2dp), NOT '2e-15'
      expect(mockOnRawInputChange).toHaveBeenCalledWith('')
    })

    it('does not call onRawInputChange when no fiat price', () => {
      const { result } = renderHook(() => useFiatConversion({ ...defaultArgs, rawInput: '10', fiatRate: undefined }))
      act(() => result.current.toggleMode())
      expect(mockOnRawInputChange).not.toHaveBeenCalled()
    })
  })

  describe('zero / missing fiat rate', () => {
    it('reports hasFiatPrice false when rate is undefined', () => {
      const { result } = renderHook(() => useFiatConversion({ ...defaultArgs, fiatRate: undefined }))
      expect(result.current.hasFiatPrice).toBe(false)
    })

    it('reports hasFiatPrice false when rate is "0"', () => {
      const { result } = renderHook(() => useFiatConversion({ ...defaultArgs, fiatRate: '0' }))
      expect(result.current.hasFiatPrice).toBe(false)
    })

    it('falls back to token mode display when no fiat price', () => {
      const { result } = renderHook(() =>
        useFiatConversion({
          ...defaultArgs,
          rawInput: '1.5',
          fiatRate: undefined,
        }),
      )
      expect(result.current.tokenAmount).toBe('1.5')
      expect(result.current.primaryDisplay).toBe('1.5 ETH')
      expect(result.current.secondaryDisplay).toBe('')
    })
  })

  describe('floating-point precision', () => {
    it('truncates (floors) fiat-to-token so user never overspends', () => {
      // 10 / 3 = 3.3333... with 8 decimals should truncate, not round
      const { result } = renderHook(() =>
        useFiatConversion({
          ...defaultArgs,
          rawInput: '10',
          fiatRate: '3',
          decimals: 8,
        }),
      )
      const token = result.current.tokenAmount
      // Verify it's truncated, not rounded
      const parts = token.split('.')
      expect(parts.length).toBe(2)
      expect(parts[1].length).toBeLessThanOrEqual(8)
      // The value should be <= 10/3 (exact)
      expect(parseFloat(token)).toBeLessThanOrEqual(10 / 3)
    })

    it('handles very small fiat amounts', () => {
      const { result } = renderHook(() =>
        useFiatConversion({
          ...defaultArgs,
          rawInput: '0.01',
          fiatRate: '2000',
          decimals: 18,
        }),
      )
      // 0.01 / 2000 = 0.000005
      expect(result.current.tokenAmount).toBe('0.000005')
    })
  })
})
