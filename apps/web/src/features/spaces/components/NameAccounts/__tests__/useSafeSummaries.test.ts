import { renderHook } from '@/tests/test-utils'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { AllSafeItems, SafeItem } from '@/hooks/safes'
import * as gatewayApi from '@/store/api/gateway'
import { useSafeSummaries } from '../useSafeSummaries'

jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: () => null }))

const ADDRESS = '0xAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaA'

const safeItem = (chainId: string): SafeItem => ({
  chainId,
  address: ADDRESS,
  name: undefined,
  isPinned: true,
  isReadOnly: false,
  lastVisited: 0,
})

const overview = (chainId: string, threshold: number, owners: number, fiatTotal: string): SafeOverview =>
  ({
    chainId,
    address: { value: ADDRESS },
    threshold,
    owners: Array.from({ length: owners }, (_, i) => ({ value: `0x${i}` })),
    fiatTotal,
  }) as SafeOverview

const mockQuery = (data: SafeOverview[] | undefined) =>
  jest.spyOn(gatewayApi, 'useGetMultipleSafeOverviewsQuery').mockReturnValue({ data } as never)

describe('useSafeSummaries', () => {
  beforeEach(() => jest.restoreAllMocks())

  it('reports loading until the overviews arrive', () => {
    mockQuery(undefined)
    const { result } = renderHook(() => useSafeSummaries([safeItem('1')]))

    expect(result.current.get(ADDRESS.toLowerCase())).toEqual({ thresholdMixed: false, loaded: false })
  })

  it('reads threshold, owners and balance from a single Safe overview', () => {
    mockQuery([overview('1', 2, 3, '150.5')])
    const { result } = renderHook(() => useSafeSummaries([safeItem('1')]))

    expect(result.current.get(ADDRESS.toLowerCase())).toEqual({
      threshold: 2,
      owners: 3,
      thresholdMixed: false,
      balance: '150.5',
      loaded: true,
    })
  })

  it('sums balances across chains and flags a multichain Safe with differing setups', () => {
    mockQuery([overview('1', 1, 1, '10'), overview('137', 2, 2, '5')])
    const items: AllSafeItems = [
      { address: ADDRESS, name: undefined, isPinned: true, lastVisited: 0, safes: [safeItem('1'), safeItem('137')] },
    ]
    const { result } = renderHook(() => useSafeSummaries(items))

    expect(result.current.get(ADDRESS.toLowerCase())).toEqual({
      threshold: undefined,
      owners: undefined,
      thresholdMixed: true,
      balance: '15',
      loaded: true,
    })
  })
})
