import { renderHook } from '@testing-library/react'
import { useAllChainIds } from '../useAllChainIds'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [{ chainId: '1' }, { chainId: '137' }] }),
}))

describe('useAllChainIds', () => {
  it('returns the chain id of every supported chain', () => {
    const { result } = renderHook(() => useAllChainIds())

    expect(result.current).toEqual(['1', '137'])
  })
})
