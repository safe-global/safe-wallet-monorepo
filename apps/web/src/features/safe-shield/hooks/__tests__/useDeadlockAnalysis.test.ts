import { renderHook, waitFor } from '@testing-library/react'
import { useDeadlockAnalysis } from '../useDeadlockAnalysis'
import { DeadlockStatus } from '@safe-global/utils/features/safe-shield/types'

const mockTriggerGetSafe = jest.fn()
const mockUnwrap = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/safes', () => ({
  useLazySafesGetSafeV1Query: () => [
    (...args: unknown[]) => {
      mockTriggerGetSafe(...args)
      return { unwrap: mockUnwrap }
    },
  ],
}))

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: jest.fn(() => '1'),
}))

const buildSafeResponse = (owners: string[], threshold = 1) => ({
  owners: owners.map((addr) => ({ value: addr })),
  threshold,
})

describe('useDeadlockAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns empty result when params are undefined', () => {
    const { result } = renderHook(() => useDeadlockAnalysis(undefined, undefined, undefined))

    const [data, error, loading] = result.current
    expect(data).toBeUndefined()
    expect(error).toBeUndefined()
    expect(loading).toBe(false)
  })

  it('returns empty result when projectedOwners is empty', () => {
    const { result } = renderHook(() => useDeadlockAnalysis('0xSafe', [], 1))

    const [data, error, loading] = result.current
    expect(data).toBeUndefined()
    expect(error).toBeUndefined()
    expect(loading).toBe(false)
  })

  it('returns valid when all owners are EOAs (not Safes)', async () => {
    mockUnwrap.mockRejectedValue({ status: 404, data: { message: 'Not Found' } })

    const { result } = renderHook(() => useDeadlockAnalysis('0xSafe', ['0xEOA1', '0xEOA2'], 1))

    await waitFor(() => {
      const [data] = result.current
      expect(data?.status).toBe(DeadlockStatus.VALID)
    })
  })

  it('returns valid when Safe owner does not create mutual ownership', async () => {
    mockUnwrap
      .mockResolvedValueOnce(buildSafeResponse(['0xOtherEOA'], 1))
      .mockRejectedValue({ status: 404, data: { message: 'Not Found' } })

    const { result } = renderHook(() => useDeadlockAnalysis('0xSafe', ['0xSafeOwner'], 1))

    await waitFor(() => {
      const [data] = result.current
      expect(data?.status).toBe(DeadlockStatus.VALID)
    })
  })

  it('returns blocked when mutual ownership creates deadlock', async () => {
    mockUnwrap.mockImplementation(() => {
      return Promise.resolve(buildSafeResponse(['0xSafe', '0xEOA'], 2))
    })

    const { result } = renderHook(() => useDeadlockAnalysis('0xSafe', ['0xSafeOwner'], 1))

    await waitFor(() => {
      const [data] = result.current
      expect(data?.status).toBe(DeadlockStatus.BLOCKED)
    })
  })

  it('returns unknown when a Safe owner fetch fails with network error', async () => {
    mockUnwrap.mockRejectedValue({ status: 500, data: { message: 'Internal Server Error' } })

    const { result } = renderHook(() => useDeadlockAnalysis('0xSafe', ['0xOwner1'], 1))

    await waitFor(() => {
      const [data] = result.current
      expect(data?.status).toBe(DeadlockStatus.UNKNOWN)
      expect(data?.fetchFailures).toContain('0xOwner1')
    })
  })

  it('does not clobber state when inputs change (cancellation)', async () => {
    let resolveFirst: (value: unknown) => void
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve
    })

    mockUnwrap
      .mockImplementationOnce(() => firstPromise)
      .mockRejectedValue({ status: 404, data: { message: 'Not Found' } })

    const { result, rerender } = renderHook(
      ({ owners }: { owners: string[] }) => useDeadlockAnalysis('0xSafe', owners, 1),
      { initialProps: { owners: ['0xSlowOwner'] } },
    )

    // Change inputs before first fetch resolves
    rerender({ owners: ['0xFastOwner'] })

    await waitFor(() => {
      const [data] = result.current
      expect(data?.status).toBe(DeadlockStatus.VALID)
    })

    // Now resolve the stale first fetch — it should NOT overwrite state
    resolveFirst!(buildSafeResponse(['0xSafe'], 2))

    // Give time for the stale promise to settle
    await new Promise((r) => setTimeout(r, 50))

    // Result should still be 'valid' from the second (current) run
    const [data] = result.current
    expect(data?.status).toBe(DeadlockStatus.VALID)
  })
})
