import { act, renderHook } from '@testing-library/react'
import useReportDrawer from '../useReportDrawer'
import type { ScanContext } from '@/features/security/types'
import type { OverviewMap, SpaceSafeEntry } from '../../types'

let mockScanContext: ScanContext | null = null
const safeScanContextMock = jest.fn()

jest.mock('@/features/spaces/hooks/useSafeScanContext', () => ({
  __esModule: true,
  default: (...args: unknown[]) => {
    safeScanContextMock(...args)
    return mockScanContext
  },
}))

const SAFE_A = '0xA000000000000000000000000000000000000000'
const SAFE_B = '0xB000000000000000000000000000000000000000'
const CHAIN = '1'

const mkSafe = (address: string): SpaceSafeEntry => ({
  address,
  chainId: CHAIN,
  name: `Safe ${address.slice(0, 6)}`,
  isMultichain: false,
  chainEntries: [{ chainId: CHAIN, isDeployed: true }],
})

const mkSecurity = (isReady = true) =>
  ({
    $isReady: isReady,
    scanKey: (address: string, chainId: string) => `${address}:${chainId}`,
  }) as unknown as Parameters<typeof useReportDrawer>[0]['security']

describe('useReportDrawer', () => {
  beforeEach(() => {
    mockScanContext = null
    safeScanContextMock.mockReset()
  })

  it('starts with no Safe selected', () => {
    const { result } = renderHook(() => useReportDrawer({ security: mkSecurity(), safes: [], overviewMap: {} }))

    expect(result.current.selectedSafe).toBeNull()
    expect(result.current.selectedEntry).toBeUndefined()
  })

  it('openReport selects a Safe', () => {
    const safes = [mkSafe(SAFE_A), mkSafe(SAFE_B)]
    const { result } = renderHook(() => useReportDrawer({ security: mkSecurity(), safes, overviewMap: {} }))

    act(() => result.current.openReport(SAFE_A, CHAIN))

    expect(result.current.selectedSafe).toEqual({ address: SAFE_A, chainId: CHAIN })
    expect(result.current.selectedEntry).toBe(safes[0])
  })

  it('openReport on the same Safe twice toggles the selection off', () => {
    const safes = [mkSafe(SAFE_A)]
    const { result } = renderHook(() => useReportDrawer({ security: mkSecurity(), safes, overviewMap: {} }))

    act(() => result.current.openReport(SAFE_A, CHAIN))
    expect(result.current.selectedSafe).not.toBeNull()

    act(() => result.current.openReport(SAFE_A, CHAIN))
    expect(result.current.selectedSafe).toBeNull()
  })

  it('openReport on a different Safe replaces the selection', () => {
    const safes = [mkSafe(SAFE_A), mkSafe(SAFE_B)]
    const { result } = renderHook(() => useReportDrawer({ security: mkSecurity(), safes, overviewMap: {} }))

    act(() => result.current.openReport(SAFE_A, CHAIN))
    act(() => result.current.openReport(SAFE_B, CHAIN))

    expect(result.current.selectedSafe).toEqual({ address: SAFE_B, chainId: CHAIN })
    expect(result.current.selectedEntry).toBe(safes[1])
  })

  it('closeReport clears the selection', () => {
    const safes = [mkSafe(SAFE_A)]
    const { result } = renderHook(() => useReportDrawer({ security: mkSecurity(), safes, overviewMap: {} }))

    act(() => result.current.openReport(SAFE_A, CHAIN))
    act(() => result.current.closeReport())

    expect(result.current.selectedSafe).toBeNull()
  })

  it('passes the pre-fetched overview from overviewMap to useSafeScanContext', () => {
    const safes = [mkSafe(SAFE_A)]
    const overviewMap: OverviewMap = { [`${SAFE_A}:${CHAIN}`]: { balanceUsd: 1234, queuedTxCount: 2 } }
    const { result } = renderHook(() => useReportDrawer({ security: mkSecurity(), safes, overviewMap }))

    act(() => result.current.openReport(SAFE_A, CHAIN))

    expect(safeScanContextMock).toHaveBeenLastCalledWith({ address: SAFE_A, chainId: CHAIN }, safes[0], {
      balanceUsd: 1234,
      queuedTxCount: 2,
    })
  })

  it('passes undefined when the security feature is not ready', () => {
    const safes = [mkSafe(SAFE_A)]
    const overviewMap: OverviewMap = { [`${SAFE_A}:${CHAIN}`]: { balanceUsd: 1234, queuedTxCount: 2 } }
    const { result } = renderHook(() => useReportDrawer({ security: mkSecurity(false), safes, overviewMap }))

    act(() => result.current.openReport(SAFE_A, CHAIN))

    expect(safeScanContextMock).toHaveBeenLastCalledWith({ address: SAFE_A, chainId: CHAIN }, safes[0], undefined)
  })

  it('returns the resolved scanContext from useSafeScanContext', () => {
    const ctx = { safeAddress: SAFE_A, chainId: CHAIN } as ScanContext
    mockScanContext = ctx
    const safes = [mkSafe(SAFE_A)]
    const { result } = renderHook(() => useReportDrawer({ security: mkSecurity(), safes, overviewMap: {} }))

    act(() => result.current.openReport(SAFE_A, CHAIN))

    expect(result.current.scanContext).toBe(ctx)
  })
})
