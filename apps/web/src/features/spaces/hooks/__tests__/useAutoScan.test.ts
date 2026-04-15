import { act, renderHook, waitFor } from '@testing-library/react'
import useAutoScan, { type AutoScanServices } from '../useAutoScan'
import type { ScanContext, ScanResult, SecurityScanner } from '@/features/security/types'
import type { SpaceSafeEntry, SelectedSafe } from '@/features/spaces/components/SecurityHub'

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
const mkScanner = (id: string, result: ScanResult = mkResult()): SecurityScanner => ({
  id,
  scan: jest.fn(() => Promise.resolve(result)),
})

/** A scanner that rejects — simulates a failure that should NOT block the queue. */
const mkFailingScanner = (id: string, error: Error = new Error('boom')): SecurityScanner => ({
  id,
  scan: jest.fn(() => Promise.reject(error)),
})

/** Build the services bundle with sensible defaults + a real cache Map. */
const mkServices = (scanners: SecurityScanner[]): AutoScanServices & { cache: Map<string, unknown> } => {
  const cache = new Map<string, unknown>()
  return {
    scanners,
    scanKey: (address: string, chainId: string) => `${address}:${chainId}`,
    getScanResultsCache: () => cache as never,
    evictScanCache: jest.fn(),
    // Pass-through timeout wrapper for tests (real version races with a 15s timer)
    withScannerTimeout: <T>(p: Promise<T>) => p,
    cache,
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
    const { result } = renderHook(() => useAutoScan([], [], {}, mkServices([mkScanner('a')]), jest.fn()))
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
    const services = mkServices([mkScanner('a')])
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

  it('writes completed results to the shared cache via getScanResultsCache', async () => {
    const scanner = mkScanner('account_setup')
    const services = mkServices([scanner])
    mockScanContext = mkContext()

    const queue = [mkSelected(SAFE_A)]
    const { result } = renderHook(() => useAutoScan(queue, [mkSafe(SAFE_A)], {}, services, jest.fn()))

    act(() => {
      result.current.startScan()
    })

    await waitFor(() => expect(services.cache.has(`${SAFE_A}:${CHAIN}`)).toBe(true))
    expect(services.evictScanCache).toHaveBeenCalled()
  })

  it('advances past failing scanners — queue still drains', async () => {
    const onComplete = jest.fn()
    // One pass + one fail; the Safe should still complete and the queue should drain.
    const passing = mkScanner('account_setup', mkResult({ status: 'clear' }))
    const failing = mkFailingScanner('modules')
    const services = mkServices([passing, failing])
    mockScanContext = mkContext()

    const queue = [mkSelected(SAFE_A)]
    const { result } = renderHook(() => useAutoScan(queue, [mkSafe(SAFE_A)], {}, services, onComplete))

    act(() => {
      result.current.startScan()
    })

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
    // Passing result is recorded; failing one is omitted (not rethrown)
    const [, , , results] = onComplete.mock.calls[0]
    expect(results).toHaveProperty('account_setup')
    expect(results).not.toHaveProperty('modules')
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
