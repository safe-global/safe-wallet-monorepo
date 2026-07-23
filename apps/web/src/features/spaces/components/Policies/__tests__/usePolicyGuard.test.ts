import { renderHook } from '@/tests/test-utils'
import * as safesApi from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { usePolicyGuard } from '../usePolicyGuard'

const CHAIN_ID = '1'
const SAFE = '0x1111111111111111111111111111111111111111'
const GUARD = '0x2222222222222222222222222222222222222222'
const OTHER_GUARD = '0x9999999999999999999999999999999999999999'

const mockSafe = (guard?: string) =>
  jest
    .spyOn(safesApi, 'useSafesGetSafeV1Query')
    .mockReturnValue({ data: guard ? { guard: { value: guard } } : { guard: null }, isLoading: false } as never)

describe('usePolicyGuard', () => {
  afterEach(() => jest.restoreAllMocks())

  it('reports not-set when the Safe has no guard', () => {
    mockSafe(undefined)
    const { result } = renderHook(() => usePolicyGuard(CHAIN_ID, SAFE, GUARD))

    expect(result.current.currentGuard).toBeUndefined()
    expect(result.current.isSet).toBe(false)
    expect(result.current.isUnknownGuard).toBe(false)
  })

  it('reports set when the guard IS the expected SafePolicyGuard', () => {
    mockSafe(GUARD)
    const { result } = renderHook(() => usePolicyGuard(CHAIN_ID, SAFE, GUARD))

    expect(result.current.isSet).toBe(true)
    expect(result.current.isUnknownGuard).toBe(false)
  })

  it('matches case-insensitively', () => {
    mockSafe(GUARD.toUpperCase().replace('0X', '0x'))
    const { result } = renderHook(() => usePolicyGuard(CHAIN_ID, SAFE, GUARD))
    expect(result.current.isSet).toBe(true)
  })

  it('flags a foreign guard when a different guard is set', () => {
    mockSafe(OTHER_GUARD)
    const { result } = renderHook(() => usePolicyGuard(CHAIN_ID, SAFE, GUARD))

    expect(result.current.isSet).toBe(false)
    expect(result.current.isUnknownGuard).toBe(true)
    expect(result.current.currentGuard).toBe(OTHER_GUARD)
  })
})
