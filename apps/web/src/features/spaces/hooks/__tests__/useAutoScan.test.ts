import { act, renderHook, waitFor } from '@testing-library/react'
import useAutoScan, { type AutoScanServices } from '../useAutoScan'
import type { ScanContext, ScanResult, ScannerId, SecurityScanner } from '@/features/security/types'
import type { SpaceSafeEntry, SelectedSafe } from '../../components/SecurityHub'

// useSafeScanContext is mocked to return the value we inject via `mockScanContext`
// so these tests stay focused on queue/scanner orchestration, not the context builder.
let mockScanContext: ScanContext | null = null
jest.mock('@/features/spaces/hooks/useSafeScanContext', () => ({
  __esModule: true,
  default: () => mockScanContext,
}))

// ── fixtures ─────────────────────────────────────────────────────────────

const SAFE_A = '0xA000000000000000000000000000000000000000'
const SAFE_B = '0xB000000000000000000000000000000000000000'
const CHAIN = '1'

const mkSafe = (address: string, chainId = CHAIN): SpaceSafeEntry => ({
  address,
  chainId,
  name: `Safe ${address.slice(0, 6)}`,
  isMultichain: false,
  chainEntries: [{ chainId, isDeployed: true }],
})

const mkSelected = (address: string, chainId = CHAIN): SelectedSafe => ({ address, chainId })

const mkResult = (overrides: Partial<ScanResult> = {}): ScanResult => ({
  status: 'clear',
  severity: 'Low',
  score: 100,
  evidence: [],
  remediation: '',
  lastChecked: new Date().toISOString(),
  ...overrides,
})

const mkContext = (): ScanContext => ({
  owners: [],
  threshold: 1,
  modules: null,
  guard: null,
  fallbackHandler: null,
  implementationVersionState: 'UP_TO_DATE',
  implementationAddress: '0x',
  version: '1.4.1',
  chainId: CHAIN,
  safeAddress: SAFE_A,
  latestVersion: '1.4.1',
  isNonCriticalUpdate: false,
  masterCopyDeployer: 'Gnosis',
  nonce: 0,
  queuedTxCount: 0,
  balanceUsd: 0,
  chainSupportsRecovery: false,
  chainSupportsHypernative: false,
  chainSupportsTransactionScanning: false,
  isMultichain: false,
  multichainSignersConsistent: true,
  multichainDeviatingChains: [],
  creationInfo: null,
})

/** A scanner that resolves on the next tick with a static result. */
const mkScanner = (id: ScannerId, result: ScanResult = mkResult()): SecurityScanner => ({
  id,
  scan: jest.fn(() => Promise.resolve(result)),
})

/** A scanner that rejects — simulates a failure that should NOT block the queue. */
const mkFailingScanner = (id: ScannerId, error: Error = new Error('boom')): SecurityScanner => ({
  id,
  scan: jest.fn(() => Promise.reject(error)),
})

/** Build the services bundle with sensible defaults + an in-test setCachedScan spy. */
const mkServices = (
  scanners: SecurityScanner[],
): AutoScanServices & { writes: Map<string, { results: Record<string, ScanResult>; timestamp: number }> } => {
  const writes = new Map<string, { results: Record<string, ScanResult>; timestamp: number }>()
  return {
    scanners,
    scanKey: (address: string, chainId: string) => `${address}:${chainId}`,
    setCachedScan: jest.fn((key: string, results, timestamp) => {
      writes.set(key, { results: results as Record<string, ScanResult>, timestamp })
    }),
    // Pass-through timeout wrapper for tests (real version races with a 15s timer)
    withScannerTimeout: <T>(p: Promise<T>) => p,
    writes,
  }
}

// ── tests ────────────────────────────────────────────────────────────────

describe('useAutoScan', () => {
  beforeEach(() => {
    mockScanContext = null
    jest.useFakeTimers()
    // Silence expected console.error for failing-scanner tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('returns initial idle state', () => {
    const { result } = renderHook(() => useAutoScan([], [], {}, mkServices([mkScanner('account_setup')]), jest.fn()))
    expect(result.current.isRunning).toBe(false)
    expect(result.current.justCompleted).toBe(false)
    expect(result.current.scanningKeys.size).toBe(0)
  })

  it('startScan no-ops when services are null', () => {
    const onComplete = jest.fn()
    const queue = [mkSelected(SAFE_A)]
    const { result } = renderHook(() => useAutoScan(queue, [mkSafe(SAFE_A)], {}, null, onComplete))

    act(() => {
      result.current.startScan()
    })

    // Services were null, so startScan should early-return without changing state
    expect(result.current.isRunning).toBe(false)
    expect(result.current.scanningKeys.size).toBe(0)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('populates scanningKeys and starts running when startScan is called', () => {
    const services = mkServices([mkScanner('account_setup')])
    const queue = [mkSelected(SAFE_A), mkSelected(SAFE_B)]
    const { result } = renderHook(() => useAutoScan(queue, [mkSafe(SAFE_A), mkSafe(SAFE_B)], {}, services, jest.fn()))

    act(() => {
      result.current.startScan()
    })

    expect(result.current.isRunning).toBe(true)
    expect(result.current.scanningKeys.size).toBe(2)
    expect(result.current.scanningKeys.has(`${SAFE_A}:${CHAIN}`)).toBe(true)
    expect(result.current.scanningKeys.has(`${SAFE_B}:${CHAIN}`)).toBe(true)
  })

  it('runs scanners and invokes onComplete when context is ready', async () => {
    const onComplete = jest.fn()
    const scanner = mkScanner('account_setup', mkResult({ status: 'clear' }))
    const services = mkServices([scanner])
    mockScanContext = mkContext()

    const queue = [mkSelected(SAFE_A)]
    const { result } = renderHook(() => useAutoScan(queue, [mkSafe(SAFE_A)], {}, services, onComplete))

    act(() => {
      result.current.startScan()
    })

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
    expect(scanner.scan).toHaveBeenCalledWith(mockScanContext)
    expect(onComplete).toHaveBeenCalledWith(
      SAFE_A,
      CHAIN,
      expect.any(Number),
      expect.objectContaining({ account_setup: expect.objectContaining({ status: 'clear' }) }),
    )
  })

  it('writes completed results to the shared cache via setCachedScan', async () => {
    const scanner = mkScanner('account_setup')
    const services = mkServices([scanner])
    mockScanContext = mkContext()

    const queue = [mkSelected(SAFE_A)]
    const { result } = renderHook(() => useAutoScan(queue, [mkSafe(SAFE_A)], {}, services, jest.fn()))

    act(() => {
      result.current.startScan()
    })

    await waitFor(() => expect(services.writes.has(`${SAFE_A}:${CHAIN}`)).toBe(true))
    expect(services.setCachedScan).toHaveBeenCalledWith(
      `${SAFE_A}:${CHAIN}`,
      expect.objectContaining({ account_setup: expect.any(Object) }),
      expect.any(Number),
    )
  })

  it('does not commit a partial scan (a scanner failed) but still drains the queue', async () => {
    const onComplete = jest.fn()
    // One pass + one fail: the Safe's result set is incomplete, so it must NOT be
    // committed (committing a partial set would shift the gauge score between scans).
    // The queue must still advance so it doesn't hang.
    const passing = mkScanner('account_setup', mkResult({ status: 'clear' }))
    const failing = mkFailingScanner('modules')
    const services = mkServices([passing, failing])
    mockScanContext = mkContext()

    const queue = [mkSelected(SAFE_A)]
    const { result } = renderHook(() => useAutoScan(queue, [mkSafe(SAFE_A)], {}, services, onComplete))

    act(() => {
      result.current.startScan()
    })

    // Queue drains: scanning key released and the run stops.
    await waitFor(() => expect(result.current.isRunning).toBe(false))
    expect(result.current.scanningKeys.has(`${SAFE_A}:${CHAIN}`)).toBe(false)
    // Partial scan is NOT committed anywhere…
    expect(onComplete).not.toHaveBeenCalled()
    expect(services.setCachedScan).not.toHaveBeenCalled()
    // …and the incomplete state is surfaced so the gauge can keep the prior score.
    expect(result.current.scanIncomplete).toBe(true)
  })

  it('commits a complete scan and reports scanIncomplete=false', async () => {
    const onComplete = jest.fn()
    const a = mkScanner('account_setup', mkResult({ status: 'clear' }))
    const b = mkScanner('modules', mkResult({ status: 'clear' }))
    const services = mkServices([a, b])
    mockScanContext = mkContext()

    const queue = [mkSelected(SAFE_A)]
    const { result } = renderHook(() => useAutoScan(queue, [mkSafe(SAFE_A)], {}, services, onComplete))

    act(() => {
      result.current.startScan()
    })

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
    expect(services.setCachedScan).toHaveBeenCalledTimes(1)
    expect(result.current.scanIncomplete).toBe(false)
  })

  it('resets scanIncomplete when a fresh scan starts', async () => {
    const onComplete = jest.fn()
    const passing = mkScanner('account_setup', mkResult({ status: 'clear' }))
    const failing = mkFailingScanner('modules')
    const services = mkServices([passing, failing])
    mockScanContext = mkContext()

    const queue = [mkSelected(SAFE_A)]
    const { result } = renderHook(() => useAutoScan(queue, [mkSafe(SAFE_A)], {}, services, onComplete))

    act(() => {
      result.current.startScan()
    })
    await waitFor(() => expect(result.current.scanIncomplete).toBe(true))

    // Starting a new scan clears the stale incomplete flag immediately.
    act(() => {
      result.current.startScan()
    })
    expect(result.current.scanIncomplete).toBe(false)
  })

  it('marks scanIncomplete when a target is bailed past', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    const onComplete = jest.fn()
    const scanner = mkScanner('account_setup')
    const services = mkServices([scanner])

    // scanContext never resolves for SAFE_A → bail path fires.
    mockScanContext = null
    const queue = [mkSelected(SAFE_A)]
    const { result } = renderHook(() => useAutoScan(queue, [mkSafe(SAFE_A)], {}, services, onComplete))

    act(() => {
      result.current.startScan()
    })

    await act(async () => {
      jest.advanceTimersByTime(10_000)
    })

    await waitFor(() => expect(result.current.scanIncomplete).toBe(true))
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('sets justCompleted briefly after the queue drains, then clears it', async () => {
    const scanner = mkScanner('account_setup')
    const services = mkServices([scanner])
    mockScanContext = mkContext()

    const queue = [mkSelected(SAFE_A)]
    const { result } = renderHook(() => useAutoScan(queue, [mkSafe(SAFE_A)], {}, services, jest.fn()))

    act(() => {
      result.current.startScan()
    })

    await waitFor(() => expect(result.current.isRunning).toBe(false))
    expect(result.current.justCompleted).toBe(true)

    // Advance past the 2.5s completion grace period
    act(() => {
      jest.advanceTimersByTime(2600)
    })
    expect(result.current.justCompleted).toBe(false)
  })

  it('bails past a target whose scanContext never resolves so the queue keeps draining', async () => {
    // Regression: a multichain Safe can include chains marked isDeployed=true locally but
    // counterfactual in reality; Safe/masterCopies queries 404, scanContext stays null,
    // and the sequential queue used to hang indefinitely.
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    const onComplete = jest.fn()
    const scanner = mkScanner('account_setup')
    const services = mkServices([scanner])

    // Leave scanContext null for SAFE_A (simulates the hung queries) but resolve for SAFE_B.
    mockScanContext = null
    const queue = [mkSelected(SAFE_A), mkSelected(SAFE_B)]
    const safes = [mkSafe(SAFE_A), mkSafe(SAFE_B)]
    const { result, rerender } = renderHook(() => useAutoScan(queue, safes, {}, services, onComplete))

    act(() => {
      result.current.startScan()
    })

    // While scanContext is null for SAFE_A, the scanner never fires.
    expect(scanner.scan).not.toHaveBeenCalled()

    // Advance past the bail timeout — queue should move off SAFE_A and onto SAFE_B.
    mockScanContext = mkContext()
    await act(async () => {
      jest.advanceTimersByTime(15_000)
    })
    rerender()

    // SAFE_A's scanning key should have been released so its table row stops showing loading.
    await waitFor(() => expect(result.current.scanningKeys.has(`${SAFE_A}:${CHAIN}`)).toBe(false))
    // SAFE_B runs normally and completes.
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(SAFE_B, CHAIN, expect.any(Number), expect.any(Object)))
  })

  it('flags isRescanning while a manual re-scan runs and clears it when done', async () => {
    const scanner = mkScanner('account_setup')
    const services = mkServices([scanner])
    mockScanContext = mkContext()

    const queue = [mkSelected(SAFE_A)]
    const { result } = renderHook(() => useAutoScan(queue, [mkSafe(SAFE_A)], {}, services, jest.fn()))

    act(() => {
      result.current.startScan({ isManual: true })
    })
    expect(result.current.isRescanning).toBe(true)

    // Let the scan finish, then advance past the minimum-visible window.
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    act(() => {
      jest.advanceTimersByTime(1_000)
    })
    expect(result.current.isRunning).toBe(false)
    expect(result.current.isRescanning).toBe(false)
  })

  it('keeps a manual re-scan visible for a minimum duration even if it finishes instantly', async () => {
    const scanner = mkScanner('account_setup')
    const services = mkServices([scanner])
    mockScanContext = mkContext()

    const queue = [mkSelected(SAFE_A)]
    const { result } = renderHook(() => useAutoScan(queue, [mkSafe(SAFE_A)], {}, services, jest.fn()))

    act(() => {
      result.current.startScan({ isManual: true })
    })

    // Let the fast scanner resolve + effects flush WITHOUT advancing the min-visible timer.
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    // Scan already completed, but the "Scanning..." state must still be showing.
    expect(result.current.isRunning).toBe(true)

    // Once the minimum window (1s) elapses, it finishes.
    act(() => {
      jest.advanceTimersByTime(1_000)
    })
    expect(result.current.isRunning).toBe(false)
  })

  it('does not hold an automatic scan open for the minimum duration', async () => {
    const scanner = mkScanner('account_setup')
    const services = mkServices([scanner])
    mockScanContext = mkContext()

    const queue = [mkSelected(SAFE_A)]
    const { result } = renderHook(() => useAutoScan(queue, [mkSafe(SAFE_A)], {}, services, jest.fn()))

    act(() => {
      result.current.startScan()
    })

    // Automatic scan finishes as soon as the scanner resolves — no minimum-visible hold.
    await waitFor(() => expect(result.current.isRunning).toBe(false))
  })

  it('does not flag isRescanning for an automatic scan', () => {
    const scanner = mkScanner('account_setup')
    const services = mkServices([scanner])
    mockScanContext = mkContext()

    const queue = [mkSelected(SAFE_A)]
    const { result } = renderHook(() => useAutoScan(queue, [mkSafe(SAFE_A)], {}, services, jest.fn()))

    act(() => {
      result.current.startScan()
    })
    expect(result.current.isRunning).toBe(true)
    expect(result.current.isRescanning).toBe(false)
  })

  it('does not bail while the tab is hidden, then resumes the countdown on return', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    const setVisibility = (state: 'visible' | 'hidden') => {
      Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    }

    const scanner = mkScanner('account_setup')
    const services = mkServices([scanner])
    // Context never resolves so only the bail timer can advance the queue.
    mockScanContext = null
    const queue = [mkSelected(SAFE_A)]
    const { result } = renderHook(() => useAutoScan(queue, [mkSafe(SAFE_A)], {}, services, jest.fn()))

    act(() => {
      result.current.startScan()
    })

    // Tab hidden: even well past the bail window, the scan must NOT be marked incomplete.
    act(() => {
      setVisibility('hidden')
    })
    act(() => {
      jest.advanceTimersByTime(10_000)
    })
    expect(result.current.scanIncomplete).toBe(false)
    expect(result.current.scanningKeys.has(`${SAFE_A}:${CHAIN}`)).toBe(true)

    // Back to the tab: the countdown restarts and bails after the window elapses.
    // Advance well past any reasonable bail window so the test is robust to its value.
    act(() => {
      setVisibility('visible')
    })
    await act(async () => {
      jest.advanceTimersByTime(10_000)
    })
    await waitFor(() => expect(result.current.scanIncomplete).toBe(true))
  })

  it('removes the scanned key from scanningKeys when its scanners complete', async () => {
    const scanner = mkScanner('account_setup')
    const services = mkServices([scanner])
    mockScanContext = mkContext()

    const queue = [mkSelected(SAFE_A)]
    const { result } = renderHook(() => useAutoScan(queue, [mkSafe(SAFE_A)], {}, services, jest.fn()))

    act(() => {
      result.current.startScan()
    })
    expect(result.current.scanningKeys.has(`${SAFE_A}:${CHAIN}`)).toBe(true)

    await waitFor(() => expect(result.current.scanningKeys.has(`${SAFE_A}:${CHAIN}`)).toBe(false))
  })
})
