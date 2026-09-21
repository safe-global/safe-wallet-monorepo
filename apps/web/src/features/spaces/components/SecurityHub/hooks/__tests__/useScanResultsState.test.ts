import { act, renderHook } from '@testing-library/react'
import useScanResultsState from '../useScanResultsState'
import type { ScanResult } from '@/features/security/types'

const useCurrentSpaceIdMock = jest.fn<string | null, []>()
jest.mock('@/features/spaces/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => useCurrentSpaceIdMock(),
}))

const SAFE_A = '0xA000000000000000000000000000000000000000'
const SAFE_B = '0xB000000000000000000000000000000000000000'
const CHAIN = '1'

const mkResult = (overrides: Partial<ScanResult> = {}): ScanResult => ({
  status: 'clear',
  severity: 'Low',
  score: 100,
  evidence: [],
  remediation: '',
  lastChecked: new Date().toISOString(),
  ...overrides,
})

const mkSecurity = (isReady = true) =>
  ({
    $isReady: isReady,
    scanKey: (address: string, chainId: string) => `${address}:${chainId}`,
  }) as unknown as Parameters<typeof useScanResultsState>[0]

describe('useScanResultsState', () => {
  beforeEach(() => {
    useCurrentSpaceIdMock.mockReset()
    useCurrentSpaceIdMock.mockReturnValue('space-1')
  })

  it('starts with empty results, empty timestamps, and null lastScannedAt', () => {
    const { result } = renderHook(() => useScanResultsState(mkSecurity()))

    expect(result.current.allScanResults).toEqual({})
    expect(result.current.scanTimestamps).toEqual({})
    expect(result.current.lastScannedAt).toBeNull()
  })

  it('records results and timestamps when handleScanComplete fires', () => {
    const { result } = renderHook(() => useScanResultsState(mkSecurity()))
    const results = { account_setup: mkResult() }

    act(() => {
      result.current.handleScanComplete(SAFE_A, CHAIN, 1000, results)
    })

    expect(result.current.allScanResults).toEqual({ [`${SAFE_A}:${CHAIN}`]: results })
    expect(result.current.scanTimestamps).toEqual({ [`${SAFE_A}:${CHAIN}`]: 1000 })
    expect(result.current.lastScannedAt).toBe(1000)
  })

  it('aggregates lastScannedAt as the max across timestamps', () => {
    const { result } = renderHook(() => useScanResultsState(mkSecurity()))

    act(() => {
      result.current.handleScanComplete(SAFE_A, CHAIN, 1000, {})
      result.current.handleScanComplete(SAFE_B, CHAIN, 2500, {})
      result.current.handleScanComplete(SAFE_A, CHAIN, 1500, {}) // overwrites SAFE_A
    })

    expect(result.current.lastScannedAt).toBe(2500)
    expect(result.current.scanTimestamps[`${SAFE_A}:${CHAIN}`]).toBe(1500)
    expect(result.current.scanTimestamps[`${SAFE_B}:${CHAIN}`]).toBe(2500)
  })

  it('no-ops when the security feature is not ready', () => {
    const { result } = renderHook(() => useScanResultsState(mkSecurity(false)))

    act(() => {
      result.current.handleScanComplete(SAFE_A, CHAIN, 1000, { account_setup: mkResult() })
    })

    expect(result.current.allScanResults).toEqual({})
    expect(result.current.scanTimestamps).toEqual({})
    expect(result.current.lastScannedAt).toBeNull()
  })

  it('keeps handleScanComplete identity stable while security props are stable', () => {
    const security = mkSecurity()
    const { result, rerender } = renderHook(() => useScanResultsState(security))
    const first = result.current.handleScanComplete

    rerender()

    expect(result.current.handleScanComplete).toBe(first)
  })

  it('clears results and timestamps when the current space changes', () => {
    const { result, rerender } = renderHook(() => useScanResultsState(mkSecurity()))

    act(() => {
      result.current.handleScanComplete(SAFE_A, CHAIN, 1000, { account_setup: mkResult() })
    })
    expect(result.current.allScanResults).not.toEqual({})
    expect(result.current.lastScannedAt).toBe(1000)

    useCurrentSpaceIdMock.mockReturnValue('space-2')
    rerender()

    expect(result.current.allScanResults).toEqual({})
    expect(result.current.scanTimestamps).toEqual({})
    expect(result.current.lastScannedAt).toBeNull()
  })

  it('does not clear state on unrelated re-renders within the same space', () => {
    const { result, rerender } = renderHook(() => useScanResultsState(mkSecurity()))

    act(() => {
      result.current.handleScanComplete(SAFE_A, CHAIN, 1000, { account_setup: mkResult() })
    })

    rerender()
    rerender()

    expect(result.current.lastScannedAt).toBe(1000)
  })

  it('does not re-clear when returning to the same space after a null id', () => {
    const { result, rerender } = renderHook(() => useScanResultsState(mkSecurity()))

    act(() => {
      result.current.handleScanComplete(SAFE_A, CHAIN, 1000, { account_setup: mkResult() })
    })

    // Transient null (e.g. route in flux) must not wipe results...
    useCurrentSpaceIdMock.mockReturnValue(null)
    rerender()
    // ...and settling back to the same space must not wipe them either.
    useCurrentSpaceIdMock.mockReturnValue('space-1')
    rerender()

    expect(result.current.lastScannedAt).toBe(1000)
    expect(result.current.allScanResults[`${SAFE_A}:${CHAIN}`]).toBeDefined()
  })

  it('does not clear state when the current space ID is null', () => {
    useCurrentSpaceIdMock.mockReturnValue('space-1')
    const { result, rerender } = renderHook(() => useScanResultsState(mkSecurity()))

    act(() => {
      result.current.handleScanComplete(SAFE_A, CHAIN, 1000, { account_setup: mkResult() })
    })

    useCurrentSpaceIdMock.mockReturnValue(null)
    rerender()

    expect(result.current.lastScannedAt).toBe(1000)
    expect(result.current.allScanResults[`${SAFE_A}:${CHAIN}`]).toBeDefined()
  })
})
