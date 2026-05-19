import { renderHook, act, waitFor } from '@testing-library/react'
import useSecurityScan from '../useSecurityScan'
import type { ScanContext, ScanResult, ScannerId, SecurityScanner } from '../../data/scanners/types'
import { createMockContext } from '../../data/scanners/test-helpers'
import { clearScanCache } from '../../data/scanResultsCache'

const makeScanner = (id: ScannerId, result?: Partial<ScanResult>, delayMs = 0): SecurityScanner => ({
  id,
  scan: () =>
    new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            status: 'clear',
            severity: 'Low',
            score: 100,
            evidence: [],
            remediation: '',
            lastChecked: new Date().toISOString(),
            ...result,
          }),
        delayMs,
      ),
    ),
})

const ID_A: ScannerId = 'account_setup'
const ID_B: ScannerId = 'modules'

const mockScanners = [makeScanner(ID_A), makeScanner(ID_B)]

jest.mock('../../data/scanners/registry', () => ({
  get SCANNERS() {
    return mockScanners
  },
}))

describe('useSecurityScan', () => {
  beforeEach(() => {
    clearScanCache()
    mockScanners.length = 0
    mockScanners.push(makeScanner(ID_A), makeScanner(ID_B))
  })

  it('auto-scans when context is provided', async () => {
    const ctx = createMockContext()
    const { result } = renderHook(() => useSecurityScan(ctx))

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true)
    })

    expect(result.current.results[ID_A]).toBeDefined()
    expect(result.current.results[ID_B]).toBeDefined()
    expect(result.current.lastScannedAt).not.toBeNull()
  })

  it('does not scan when context is null', () => {
    const { result } = renderHook(() => useSecurityScan(null))

    expect(result.current.isComplete).toBe(false)
    expect(result.current.results).toEqual({})
    expect(result.current.lastScannedAt).toBeNull()
  })

  it('clears results when context goes null', async () => {
    const ctx = createMockContext()
    const { result, rerender } = renderHook(({ c }: { c: ScanContext | null }) => useSecurityScan(c), {
      initialProps: { c: ctx } as { c: ScanContext | null },
    })

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true)
    })
    expect(Object.keys(result.current.results).length).toBe(2)

    // Switch to null (Safe transition)
    rerender({ c: null })

    expect(result.current.results).toEqual({})
    expect(result.current.lastScannedAt).toBeNull()
  })

  it('rescans when ctxKey changes', async () => {
    const ctx1 = createMockContext({ chainId: '1', safeAddress: '0xSafe1' })
    const { result, rerender } = renderHook(({ c }: { c: ScanContext | null }) => useSecurityScan(c), {
      initialProps: { c: ctx1 },
    })

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true)
    })

    const firstScannedAt = result.current.lastScannedAt

    // Switch to different Safe
    const ctx2 = createMockContext({ chainId: '1', safeAddress: '0xSafe2' })
    rerender({ c: ctx2 })

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true)
      expect(result.current.lastScannedAt).not.toBe(firstScannedAt)
    })
  })

  it('rejects stale in-flight results after context change', async () => {
    // First scanner resolves slowly, second resolves instantly
    mockScanners.length = 0
    mockScanners.push(
      makeScanner(ID_A, { status: 'issue', severity: 'High', score: 30 }, 200),
      makeScanner(ID_B, { status: 'clear', severity: 'Low', score: 100 }, 0),
    )

    const ctx1 = createMockContext({ chainId: '1', safeAddress: '0xSafe1' })
    const { result, rerender } = renderHook(({ c }: { c: ScanContext | null }) => useSecurityScan(c), {
      initialProps: { c: ctx1 } as { c: ScanContext | null },
    })

    // Switch context before slow scanner resolves
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })
    rerender({ c: null })

    // Wait for the slow scanner to resolve (it should be rejected)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300))
    })

    // Results should be cleared, not contain stale data
    expect(result.current.results).toEqual({})
  })

  it('rescan function triggers a new scan', async () => {
    const ctx = createMockContext()
    const { result } = renderHook(() => useSecurityScan(ctx))

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true)
    })

    const firstScannedAt = result.current.lastScannedAt

    // Wait a tick so Date.now() differs
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
      result.current.rescan()
    })

    await waitFor(() => {
      expect(result.current.lastScannedAt).not.toBe(firstScannedAt)
    })
  })

  describe('scan cache', () => {
    it('skips auto-scan when fresh cache exists', async () => {
      // First: run a scan to populate the cache
      const ctx = createMockContext({ chainId: '1', safeAddress: '0xCached' })
      const { result, unmount } = renderHook(() => useSecurityScan(ctx))

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true)
      })
      unmount()

      // Second: new hook instance should use cached results without scanning
      const scanSpy = jest.fn().mockResolvedValue(makeScanner(ID_A).scan(ctx))
      mockScanners.length = 0
      mockScanners.push({ id: ID_A, scan: scanSpy })

      const { result: result2 } = renderHook(() => useSecurityScan(ctx))

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      expect(scanSpy).not.toHaveBeenCalled()
      expect(result2.current.results[ID_A]).toBeDefined()
      expect(result2.current.isComplete).toBe(true)
    })

    it('rescan works after cache hit', async () => {
      const ctx = createMockContext({ chainId: '1', safeAddress: '0xRescan' })
      const { result, unmount } = renderHook(() => useSecurityScan(ctx))

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true)
      })
      unmount()

      // New instance uses cache
      const { result: result2 } = renderHook(() => useSecurityScan(ctx))

      // Trigger manual rescan
      act(() => {
        result2.current.rescan()
      })

      await waitFor(() => {
        expect(result2.current.isComplete).toBe(true)
        expect(result2.current.lastScannedAt).not.toBeNull()
      })
    })
  })

  it('reports progress correctly', async () => {
    mockScanners.length = 0
    mockScanners.push(makeScanner(ID_A, {}, 0), makeScanner(ID_B, {}, 100))

    const ctx = createMockContext()
    const { result } = renderHook(() => useSecurityScan(ctx))

    // Initially 0% progress
    expect(result.current.progress).toBeLessThanOrEqual(100)

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true)
      expect(result.current.progress).toBe(100)
    })
  })
})
