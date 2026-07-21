import { renderHook } from '@testing-library/react'
import { useSafesSearch } from './useSafesSearch'
import type { AllSafeItems, MultiChainSafeItem } from './useAllSafesGrouped'
import type { SafeItem } from './useAllSafes'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({
    configs: [
      { chainId: '1', chainName: 'Ethereum' },
      { chainId: '137', chainName: 'Polygon' },
    ],
  }),
}))

const safe = (over: Partial<SafeItem> & Pick<SafeItem, 'address' | 'chainId'>): SafeItem => ({
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
  ...over,
})

const ETH_SAFE = safe({ chainId: '1', address: '0x1111111111111111111111111111111111111111', name: 'Alpha' })
const POLYGON_SAFE = safe({ chainId: '137', address: '0x2222222222222222222222222222222222222222', name: 'Beta' })

describe('useSafesSearch', () => {
  it('returns an empty array for an empty query', () => {
    const { result } = renderHook(() => useSafesSearch([ETH_SAFE, POLYGON_SAFE], ''))
    expect(result.current).toEqual([])
  })

  it('matches by safe name', () => {
    const { result } = renderHook(() => useSafesSearch([ETH_SAFE, POLYGON_SAFE], 'Alpha'))
    expect(result.current.map((s) => s.address)).toEqual([ETH_SAFE.address])
  })

  it('matches by address', () => {
    const { result } = renderHook(() => useSafesSearch([ETH_SAFE, POLYGON_SAFE], POLYGON_SAFE.address))
    expect(result.current.map((s) => s.address)).toEqual([POLYGON_SAFE.address])
  })

  it('matches by network name', () => {
    const { result } = renderHook(() => useSafesSearch([ETH_SAFE, POLYGON_SAFE], 'Polygon'))
    expect(result.current.map((s) => s.address)).toEqual([POLYGON_SAFE.address])
  })

  it('matches a multichain safe by any of its network names', () => {
    const multiChainAddress = '0x3333333333333333333333333333333333333333'
    const multiSafe: MultiChainSafeItem = {
      address: multiChainAddress,
      name: 'Multi',
      isPinned: false,
      lastVisited: 0,
      safes: [
        safe({ chainId: '1', address: multiChainAddress, name: 'Multi' }),
        safe({ chainId: '137', address: multiChainAddress, name: 'Multi' }),
      ],
    }
    const items: AllSafeItems = [multiSafe, ETH_SAFE]

    const { result } = renderHook(() => useSafesSearch(items, 'Polygon'))

    expect(result.current.map((s) => s.address)).toEqual([multiChainAddress])
  })
})
