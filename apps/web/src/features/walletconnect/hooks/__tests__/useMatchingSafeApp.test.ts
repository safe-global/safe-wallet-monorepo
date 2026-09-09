import { renderHook } from '@/tests/test-utils'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { useMatchingSafeApp } from '../useMatchingSafeApp'

const mockQuery = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/safe-apps', () => ({
  useSafeAppsGetSafeAppsV1Query: (arg: unknown, options: unknown) => mockQuery(arg, options),
}))

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: () => '1',
}))

const mockSafeApp: SafeAppData = {
  id: 1,
  url: 'https://app.uniswap.org',
  name: 'Uniswap',
  description: '',
  chainIds: ['1'],
  accessControl: { type: 'NO_RESTRICTIONS' },
  tags: [],
  features: [],
  socialProfiles: [],
  featured: false,
}

describe('useMatchingSafeApp', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockQuery.mockReturnValue({ currentData: [mockSafeApp], isFetching: false })
  })

  it('skips the query and reports no match when there is no dApp URL', () => {
    const { result } = renderHook(() => useMatchingSafeApp(undefined))

    expect(mockQuery).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }))
    expect(result.current.safeApp).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })

  it('queries the current chain and returns the matching app', () => {
    const { result } = renderHook(() => useMatchingSafeApp('https://app.uniswap.org/swap'))

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: '1' }),
      expect.objectContaining({ skip: false }),
    )
    expect(result.current.safeApp).toEqual(mockSafeApp)
  })

  it('returns no match when the dApp has no Safe App', () => {
    const { result } = renderHook(() => useMatchingSafeApp('https://app.aave.com'))

    expect(result.current.safeApp).toBeUndefined()
  })

  it('reports loading only while a lookup is actually in flight', () => {
    mockQuery.mockReturnValue({ currentData: undefined, isFetching: true })

    const { result: withUrl } = renderHook(() => useMatchingSafeApp('https://app.uniswap.org'))
    expect(withUrl.current.isLoading).toBe(true)

    const { result: withoutUrl } = renderHook(() => useMatchingSafeApp(undefined))
    expect(withoutUrl.current.isLoading).toBe(false)
  })

  it('fails open with no match when the lookup errors', () => {
    mockQuery.mockReturnValue({ currentData: undefined, isFetching: false })

    const { result } = renderHook(() => useMatchingSafeApp('https://app.uniswap.org'))

    expect(result.current.safeApp).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })
})
