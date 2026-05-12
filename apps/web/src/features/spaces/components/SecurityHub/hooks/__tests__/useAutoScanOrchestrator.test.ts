import { renderHook } from '@testing-library/react'
import useAutoScanOrchestrator from '../useAutoScanOrchestrator'
import type { OverviewMap, SelectedSafe, SpaceSafeEntry } from '../../types'

const autoScanMock = jest.fn()
let lastServices: unknown = null

jest.mock('@/features/spaces/hooks/useAutoScan', () => ({
  __esModule: true,
  default: (
    queue: SelectedSafe[],
    safes: SpaceSafeEntry[],
    overviewMap: OverviewMap,
    services: unknown,
    onComplete: unknown,
  ) => {
    lastServices = services
    return autoScanMock(queue, safes, overviewMap, services, onComplete)
  },
}))

const useCurrentSpaceIdMock = jest.fn<string | null, []>()
jest.mock('@/features/spaces/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => useCurrentSpaceIdMock(),
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

const mkSelected = (address: string): SelectedSafe => ({ address, chainId: CHAIN })

const startScanFn = jest.fn()

const mkSecurity = (isReady = true) =>
  ({
    $isReady: isReady,
    scanners: [{ id: 'account_setup', scan: jest.fn() }],
    scanKey: (address: string, chainId: string) => `${address}:${chainId}`,
    setCachedScan: jest.fn(),
    withScannerTimeout: jest.fn(),
  }) as unknown as Parameters<typeof useAutoScanOrchestrator>[0]['security']

describe('useAutoScanOrchestrator', () => {
  beforeEach(() => {
    autoScanMock.mockReset()
    useCurrentSpaceIdMock.mockReset()
    useCurrentSpaceIdMock.mockReturnValue('space-1')
    startScanFn.mockReset()
    lastServices = null
    autoScanMock.mockReturnValue({
      scanningKeys: new Set<string>(),
      isRunning: false,
      justCompleted: false,
      startScan: startScanFn,
    })
  })

  it('builds an AutoScanServices bundle from the security handle when ready', () => {
    const security = mkSecurity()

    renderHook(() =>
      useAutoScanOrchestrator({
        security,
        deployedEntries: [],
        safes: [],
        overviewMap: {},
        isLoadingSpacesSafes: false,
        onScanComplete: jest.fn(),
      }),
    )

    expect(lastServices).toMatchObject({
      scanners: security.scanners,
      scanKey: security.scanKey,
      setCachedScan: security.setCachedScan,
      withScannerTimeout: security.withScannerTimeout,
    })
  })

  it('passes null services when the feature is not ready', () => {
    renderHook(() =>
      useAutoScanOrchestrator({
        security: mkSecurity(false),
        deployedEntries: [mkSelected(SAFE_A)],
        safes: [mkSafe(SAFE_A)],
        overviewMap: {},
        isLoadingSpacesSafes: false,
        onScanComplete: jest.fn(),
      }),
    )

    expect(lastServices).toBeNull()
  })

  it('calls startScan once when Safes appear', () => {
    const { rerender } = renderHook(
      (props: Parameters<typeof useAutoScanOrchestrator>[0]) => useAutoScanOrchestrator(props),
      {
        initialProps: {
          security: mkSecurity(),
          deployedEntries: [] as SelectedSafe[],
          safes: [] as SpaceSafeEntry[],
          overviewMap: {} as OverviewMap,
          isLoadingSpacesSafes: false,
          onScanComplete: jest.fn(),
        },
      },
    )

    expect(startScanFn).not.toHaveBeenCalled()

    rerender({
      security: mkSecurity(),
      deployedEntries: [mkSelected(SAFE_A)],
      safes: [mkSafe(SAFE_A)],
      overviewMap: {},
      isLoadingSpacesSafes: false,
      onScanComplete: jest.fn(),
    })

    expect(startScanFn).toHaveBeenCalledTimes(1)
  })

  it('does not re-call startScan when the queue identity is unchanged', () => {
    const security = mkSecurity()
    const props = {
      security,
      deployedEntries: [mkSelected(SAFE_A)],
      safes: [mkSafe(SAFE_A)],
      overviewMap: {} as OverviewMap,
      isLoadingSpacesSafes: false,
      onScanComplete: jest.fn(),
    }
    const { rerender } = renderHook((p: typeof props) => useAutoScanOrchestrator(p), { initialProps: props })

    expect(startScanFn).toHaveBeenCalledTimes(1)
    startScanFn.mockClear()

    // Different array references with the same content should not retrigger.
    rerender({ ...props, deployedEntries: [mkSelected(SAFE_A)], safes: [mkSafe(SAFE_A)] })

    expect(startScanFn).not.toHaveBeenCalled()
  })

  it('re-triggers startScan when the queue identity changes', () => {
    const security = mkSecurity()
    const props = {
      security,
      deployedEntries: [mkSelected(SAFE_A)],
      safes: [mkSafe(SAFE_A)],
      overviewMap: {} as OverviewMap,
      isLoadingSpacesSafes: false,
      onScanComplete: jest.fn(),
    }
    const { rerender } = renderHook((p: typeof props) => useAutoScanOrchestrator(p), { initialProps: props })

    startScanFn.mockClear()

    rerender({
      ...props,
      deployedEntries: [mkSelected(SAFE_A), mkSelected(SAFE_B)],
      safes: [mkSafe(SAFE_A), mkSafe(SAFE_B)],
    })

    expect(startScanFn).toHaveBeenCalledTimes(1)
  })

  it('does not call startScan while loading', () => {
    renderHook(() =>
      useAutoScanOrchestrator({
        security: mkSecurity(),
        deployedEntries: [mkSelected(SAFE_A)],
        safes: [mkSafe(SAFE_A)],
        overviewMap: {},
        isLoadingSpacesSafes: true,
        onScanComplete: jest.fn(),
      }),
    )

    expect(startScanFn).not.toHaveBeenCalled()
  })

  it('does not call startScan when the feature is not ready', () => {
    renderHook(() =>
      useAutoScanOrchestrator({
        security: mkSecurity(false),
        deployedEntries: [mkSelected(SAFE_A)],
        safes: [mkSafe(SAFE_A)],
        overviewMap: {},
        isLoadingSpacesSafes: false,
        onScanComplete: jest.fn(),
      }),
    )

    expect(startScanFn).not.toHaveBeenCalled()
  })

  it('retriggers startScan when the current space changes even if Safe keys overlap', () => {
    const security = mkSecurity()
    const props = {
      security,
      deployedEntries: [mkSelected(SAFE_A)],
      safes: [mkSafe(SAFE_A)],
      overviewMap: {} as OverviewMap,
      isLoadingSpacesSafes: false,
      onScanComplete: jest.fn(),
    }
    const { rerender } = renderHook((p: typeof props) => useAutoScanOrchestrator(p), { initialProps: props })

    expect(startScanFn).toHaveBeenCalledTimes(1)
    startScanFn.mockClear()

    // Same Safe set, different space — must still re-scan.
    useCurrentSpaceIdMock.mockReturnValue('space-2')
    rerender({ ...props, deployedEntries: [mkSelected(SAFE_A)], safes: [mkSafe(SAFE_A)] })

    expect(startScanFn).toHaveBeenCalledTimes(1)
  })

  it('returns the AutoScanState passed back from useAutoScan', () => {
    const scanningKeys = new Set([`${SAFE_A}:${CHAIN}`])
    autoScanMock.mockReturnValue({
      scanningKeys,
      isRunning: true,
      justCompleted: false,
      startScan: startScanFn,
    })

    const { result } = renderHook(() =>
      useAutoScanOrchestrator({
        security: mkSecurity(),
        deployedEntries: [],
        safes: [],
        overviewMap: {},
        isLoadingSpacesSafes: false,
        onScanComplete: jest.fn(),
      }),
    )

    expect(result.current.scanningKeys).toBe(scanningKeys)
    expect(result.current.isRunning).toBe(true)
    expect(result.current.startScan).toBe(startScanFn)
  })
})
