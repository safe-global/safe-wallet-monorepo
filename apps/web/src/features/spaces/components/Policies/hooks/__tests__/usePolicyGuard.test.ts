import { skipToken } from '@reduxjs/toolkit/query'
import { renderHook } from '@/tests/test-utils'
import * as safesApi from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { useGetModuleGuardQuery } from '@/features/policy-guard/store'
import { usePolicyGuard } from '../usePolicyGuard'

jest.mock('@/features/policy-guard/store', () => ({ useGetModuleGuardQuery: jest.fn() }))

const CHAIN_ID = '1'
const SAFE = '0x1111111111111111111111111111111111111111'
const GUARD = '0x2222222222222222222222222222222222222222'
const OTHER_GUARD = '0x9999999999999999999999999999999999999999'

type ModuleGuardQuery = ReturnType<typeof useGetModuleGuardQuery>

const mockSafe = (guard?: string, version: string | null = '1.5.0') =>
  jest.spyOn(safesApi, 'useSafesGetSafeV1Query').mockReturnValue({
    data: { guard: guard ? { value: guard } : null, version, txHistoryTag: 'tag' },
    isLoading: false,
  } as never)

const mockModuleGuard = (query: Partial<ModuleGuardQuery> = { currentData: ZERO_ADDRESS }) =>
  jest.mocked(useGetModuleGuardQuery).mockReturnValue(query as ModuleGuardQuery)

describe('usePolicyGuard', () => {
  beforeEach(() => jest.mocked(useGetModuleGuardQuery).mockReset())
  afterEach(() => jest.restoreAllMocks())

  it('reports not-set when the Safe has no guard in either slot', () => {
    mockSafe(undefined)
    mockModuleGuard()
    const { result } = renderHook(() => usePolicyGuard(CHAIN_ID, SAFE, GUARD))

    expect(result.current.currentGuard).toBeUndefined()
    expect(result.current.currentModuleGuard).toBeUndefined()
    expect(result.current.isSet).toBe(false)
    expect(result.current.isUnknownGuard).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('reads the module guard of the Safe', () => {
    mockSafe(undefined)
    const spy = mockModuleGuard()
    renderHook(() => usePolicyGuard(CHAIN_ID, SAFE, GUARD))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: CHAIN_ID, safeAddress: SAFE, txHistoryTag: 'tag' }),
    )
  })

  it.each([
    ['the transaction guard', GUARD, ZERO_ADDRESS],
    ['the module guard', undefined, GUARD],
    ['both guards', GUARD, GUARD],
  ])('reports set when %s is the expected SafePolicyGuard', (_, txGuard, moduleGuard) => {
    mockSafe(txGuard)
    mockModuleGuard({ currentData: moduleGuard })
    const { result } = renderHook(() => usePolicyGuard(CHAIN_ID, SAFE, GUARD))

    expect(result.current.isSet).toBe(true)
    expect(result.current.isUnknownGuard).toBe(false)
  })

  it('matches case-insensitively', () => {
    mockSafe(GUARD.toUpperCase().replace('0X', '0x'))
    mockModuleGuard()
    const { result } = renderHook(() => usePolicyGuard(CHAIN_ID, SAFE, GUARD))
    expect(result.current.isSet).toBe(true)
  })

  it.each([
    ['transaction', OTHER_GUARD, ZERO_ADDRESS],
    ['module', undefined, OTHER_GUARD],
  ])('flags a foreign %s guard', (_, txGuard, moduleGuard) => {
    mockSafe(txGuard)
    mockModuleGuard({ currentData: moduleGuard })
    const { result } = renderHook(() => usePolicyGuard(CHAIN_ID, SAFE, GUARD))

    expect(result.current.isSet).toBe(false)
    expect(result.current.isUnknownGuard).toBe(true)
  })

  it('stays loading until the module guard is read', () => {
    mockSafe(undefined)
    mockModuleGuard({ currentData: undefined, error: undefined })
    const { result } = renderHook(() => usePolicyGuard(CHAIN_ID, SAFE, GUARD))

    expect(result.current.isLoading).toBe(true)
  })

  it('reports a failed module guard read', () => {
    mockSafe(undefined)
    const error = new Error('RPC down')
    mockModuleGuard({ currentData: undefined, error: error as never })
    const { result } = renderHook(() => usePolicyGuard(CHAIN_ID, SAFE, GUARD))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(error)
  })

  it('skips the module guard read on a Safe older than v1.5.0', () => {
    mockSafe(undefined, '1.4.1')
    const spy = mockModuleGuard({ currentData: undefined })
    const { result } = renderHook(() => usePolicyGuard(CHAIN_ID, SAFE, GUARD))

    expect(spy).toHaveBeenCalledWith(skipToken)
    expect(result.current.isUnsupportedVersion).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })
})
