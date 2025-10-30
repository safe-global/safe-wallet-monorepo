import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { act } from 'react'
import useIsExpiredSwap from '@/features/swap/hooks/useIsExpiredSwap'
import { renderHook } from '@/tests/test-utils'
import * as guards from '@/utils/transaction-guards'

describe('useIsExpiredSwap', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns false if txInfo is not a swap order', () => {
    jest.spyOn(guards, 'isSwapOrderTxInfo').mockReturnValue(false)

    const txInfo = {} as TransactionInfo
    const { result } = renderHook(() => useIsExpiredSwap(txInfo))

    expect(result.current).toBe(false)
  })

  it('returns true if the swap has already expired', () => {
    // Mock so that txInfo is considered a swap order
    jest.spyOn(guards, 'isSwapOrderTxInfo').mockReturnValue(true)

    const now = Date.now()
    const pastUnixTime = Math.floor((now - 1000) / 1000) // 1 second in the past
    const txInfo = { validUntil: pastUnixTime } as TransactionInfo

    const { result } = renderHook(() => useIsExpiredSwap(txInfo))

    // Since expiry is in the past, should return true immediately
    expect(result.current).toBe(true)
  })

  it('returns false initially and true after expiry time if the swap has not yet expired', () => {
    jest.spyOn(guards, 'isSwapOrderTxInfo').mockReturnValue(true)

    const now = Date.now()
    // set expiry 2 seconds in the future
    const futureUnixTime = Math.floor((now + 2000) / 1000)
    const txInfo = { validUntil: futureUnixTime } as TransactionInfo

    const { result, unmount } = renderHook(() => useIsExpiredSwap(txInfo))

    // Initially should be false because it hasn't expired yet
    expect(result.current).toBe(false)

    // Advance time by 2 seconds to simulate waiting until expiry
    act(() => {
      jest.advanceTimersByTime(2000)
    })

    // After the timer completes, it should become true
    expect(result.current).toBe(true)

    // Unmount to ensure cleanup runs without errors
    unmount()
  })

  it('cancels the timeout when unmounted', () => {
    jest.spyOn(guards, 'isSwapOrderTxInfo').mockReturnValue(true)

    const now = Date.now()
    // set expiry 5 seconds in the future
    const futureUnixTime = Math.floor((now + 5000) / 1000)
    const txInfo = { validUntil: futureUnixTime } as TransactionInfo

    const { result, unmount } = renderHook(() => useIsExpiredSwap(txInfo))
    expect(result.current).toBe(false)

    // Unmount the hook before the timer finishes
    unmount()

    // Advance time to ensure no setState runs after unmount
    act(() => {
      jest.advanceTimersByTime(5000)
    })
  })

  it('uses MAX_TIMEOUT if the validUntil value is too large', () => {
    jest.spyOn(guards, 'isSwapOrderTxInfo').mockReturnValue(true)

    const MAX_TIMEOUT = 2147483647

    const now = Date.now()
    // Set validUntil so far in the future that timeUntilExpiry would exceed MAX_TIMEOUT
    const largeFutureTime = Math.floor((now + MAX_TIMEOUT + 10_000) / 1000)
    const txInfo = { validUntil: largeFutureTime } as TransactionInfo

    const { result } = renderHook(() => useIsExpiredSwap(txInfo))
    expect(result.current).toBe(false)

    // The timeout should be capped at MAX_TIMEOUT
    // Advance time by MAX_TIMEOUT and check if expired is now true
    act(() => {
      jest.advanceTimersByTime(MAX_TIMEOUT)
    })

    expect(result.current).toBe(true)
  })
})
