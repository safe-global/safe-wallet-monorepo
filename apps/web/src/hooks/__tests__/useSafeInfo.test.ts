import { renderHook } from '@/tests/test-utils'
import useSafeInfo from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import type { RootState } from '@/store'

describe('useSafeInfo hook', () => {
  it('should return default safe info when no data in Redux', () => {
    const { result } = renderHook(() => useSafeInfo())

    expect(result.current.safe).toBeDefined()
    expect(result.current.safeAddress).toBe('')
    expect(result.current.safeLoaded).toBe(false)
    expect(result.current.safeLoading).toBe(false)
    expect(result.current.safeError).toBeUndefined()
  })

  it('should return safe info when data is available', () => {
    const mockSafe = extendedSafeInfoBuilder().build()
    const mockAddress = mockSafe.address.value

    const initialReduxState: Partial<RootState> = {
      safeInfo: {
        loading: false,
        error: undefined,
        data: mockSafe,
        loaded: true,
      },
    }

    const { result } = renderHook(() => useSafeInfo(), { initialReduxState })

    expect(result.current.safe).toEqual(mockSafe)
    expect(result.current.safeAddress).toBe(mockAddress)
    expect(result.current.safeLoaded).toBe(true)
    expect(result.current.safeLoading).toBe(false)
    expect(result.current.safeError).toBeUndefined()
  })

  it('should return loading state correctly', () => {
    const initialReduxState: Partial<RootState> = {
      safeInfo: {
        loading: true,
        error: undefined,
        data: undefined,
        loaded: false,
      },
    }

    const { result } = renderHook(() => useSafeInfo(), { initialReduxState })

    expect(result.current.safeLoading).toBe(true)
    expect(result.current.safeLoaded).toBe(false)
  })

  it('should return error state correctly', () => {
    const errorMessage = 'Failed to load Safe'

    const initialReduxState: Partial<RootState> = {
      safeInfo: {
        loading: false,
        error: errorMessage,
        data: undefined,
        loaded: false,
      },
    }

    const { result } = renderHook(() => useSafeInfo(), { initialReduxState })

    expect(result.current.safeError).toBe(errorMessage)
    expect(result.current.safeLoaded).toBe(false)
    expect(result.current.safeLoading).toBe(false)
  })

  it('should extract safeAddress from data.address.value', () => {
    const mockSafe = extendedSafeInfoBuilder()
      .with({
        address: {
          value: '0x1234567890123456789012345678901234567890',
          name: 'Test Safe',
          logoUri: null,
        },
      })
      .build()

    const initialReduxState: Partial<RootState> = {
      safeInfo: {
        loading: false,
        error: undefined,
        data: mockSafe,
        loaded: true,
      },
    }

    const { result } = renderHook(() => useSafeInfo(), { initialReduxState })

    expect(result.current.safeAddress).toBe('0x1234567890123456789012345678901234567890')
  })

  it('should return empty string when no address data', () => {
    const initialReduxState: Partial<RootState> = {
      safeInfo: {
        loading: false,
        error: undefined,
        data: undefined,
        loaded: true,
      },
    }

    const { result } = renderHook(() => useSafeInfo(), { initialReduxState })

    expect(result.current.safeAddress).toBe('')
  })

  it('should handle partial safe data with all states', () => {
    const mockSafe = extendedSafeInfoBuilder()
      .with({
        threshold: 2,
        owners: [
          { value: '0x1111111111111111111111111111111111111111', name: null, logoUri: null },
          { value: '0x2222222222222222222222222222222222222222', name: null, logoUri: null },
          { value: '0x3333333333333333333333333333333333333333', name: null, logoUri: null },
        ],
        nonce: 42,
      })
      .build()

    const initialReduxState: Partial<RootState> = {
      safeInfo: {
        loading: false,
        error: undefined,
        data: mockSafe,
        loaded: true,
      },
    }

    const { result } = renderHook(() => useSafeInfo(), { initialReduxState })

    expect(result.current.safe.threshold).toBe(2)
    expect(result.current.safe.owners).toHaveLength(3)
    expect(result.current.safe.nonce).toBe(42)
  })

  it('should maintain referential equality with useMemo when data does not change', () => {
    const mockSafe = extendedSafeInfoBuilder().build()

    const initialReduxState: Partial<RootState> = {
      safeInfo: {
        loading: false,
        error: undefined,
        data: mockSafe,
        loaded: true,
      },
    }

    const { result, rerender } = renderHook(() => useSafeInfo(), { initialReduxState })

    const firstRender = result.current

    // Rerender without changing Redux state
    rerender()

    const secondRender = result.current

    // useMemo should return the same reference if dependencies haven't changed
    expect(firstRender).toBe(secondRender)
  })

  it('should handle both loading and error states simultaneously', () => {
    const initialReduxState: Partial<RootState> = {
      safeInfo: {
        loading: true,
        error: 'Network error',
        data: undefined,
        loaded: false,
      },
    }

    const { result } = renderHook(() => useSafeInfo(), { initialReduxState })

    expect(result.current.safeLoading).toBe(true)
    expect(result.current.safeError).toBe('Network error')
    expect(result.current.safeLoaded).toBe(false)
  })

  it('should handle loaded state with data', () => {
    const mockSafe = extendedSafeInfoBuilder().build()

    const initialReduxState: Partial<RootState> = {
      safeInfo: {
        loading: false,
        error: undefined,
        data: mockSafe,
        loaded: true,
      },
    }

    const { result } = renderHook(() => useSafeInfo(), { initialReduxState })

    expect(result.current.safeLoaded).toBe(true)
    expect(result.current.safe).toEqual(mockSafe)
  })
})
