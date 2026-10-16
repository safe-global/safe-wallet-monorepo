import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import { usePolicyGuard, type UsePolicyGuardResult } from '@/features/policy-guard'
import { useGuardStatus } from '../useGuardStatus'

jest.mock('@/features/policy-guard', () => ({ usePolicyGuard: jest.fn() }))

const mockUsePolicyGuard = usePolicyGuard as jest.MockedFunction<typeof usePolicyGuard>

const TARGET = { chainId: '11155111', safeAddress: faker.finance.ethereumAddress() }

const read = (result: Partial<UsePolicyGuardResult>) => {
  const refetch = jest.fn()
  mockUsePolicyGuard.mockReturnValue({ isLoading: false, isRetrying: false, refetch, ...result })
  return refetch
}

describe('useGuardStatus', () => {
  it('has no state before a Safe is picked', () => {
    read({ isLoading: true })

    const { result } = renderHook(() => useGuardStatus())

    expect(result.current.guard).toBeUndefined()
  })

  it('is loading while the guards are read', () => {
    read({ isLoading: true })

    const { result } = renderHook(() => useGuardStatus(TARGET))

    expect(result.current.guard).toEqual({ status: 'loading' })
  })

  it('passes the read state through', () => {
    read({ state: { status: 'unknown', foreignGuards: [{ slot: 'module', address: TARGET.safeAddress }] } })

    const { result } = renderHook(() => useGuardStatus(TARGET))

    expect(mockUsePolicyGuard).toHaveBeenCalledWith(TARGET)
    expect(result.current.guard).toEqual({
      status: 'unknown',
      foreignGuards: [{ slot: 'module', address: TARGET.safeAddress }],
    })
  })

  it('reports a failed read, with a retry that re-reads', () => {
    const refetch = read({ error: new Error('rpc down') })

    const { result } = renderHook(() => useGuardStatus(TARGET))
    result.current.retry()

    expect(result.current.guard).toEqual({ status: 'error' })
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('shows the check as loading again while a failed read is retried', () => {
    read({ error: new Error('rpc down'), isRetrying: true })

    const { result } = renderHook(() => useGuardStatus(TARGET))

    expect(result.current.guard).toEqual({ status: 'loading' })
  })

  it('keeps a state already read when a later read fails', () => {
    read({ state: { status: 'known' }, error: new Error('rpc down') })

    const { result } = renderHook(() => useGuardStatus(TARGET))

    expect(result.current.guard).toEqual({ status: 'known' })
  })

  it('reports a Safe CGW does not know as not activated', () => {
    read({})

    const { result } = renderHook(() => useGuardStatus(TARGET))

    expect(result.current.guard).toEqual({ status: 'not-activated' })
  })
})
