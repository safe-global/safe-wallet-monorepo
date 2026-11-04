import { fakerChecksummedAddress, renderHook } from '@/tests/test-utils'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import type { MultiChainSafeItem } from '@/hooks/safes'

jest.mock('@/hooks/safes', () => ({
  useAllSafesGrouped: jest.fn(),
}))
jest.mock('@/hooks/useSafeAddress')

import { useAllSafesGrouped } from '@/hooks/safes'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useIsMultichainSafe } from '../useIsMultichainSafe'

const mockUseAllSafesGrouped = useAllSafesGrouped as jest.Mock
const mockUseSafeAddress = useSafeAddress as jest.Mock

const multichainGroup = (address: string, chainIds: string[]): MultiChainSafeItem => ({
  address,
  safes: chainIds.map((chainId) => safeItemBuilder().with({ address, chainId }).build()),
  isPinned: false,
  lastVisited: 0,
  name: undefined,
})

describe('useIsMultichainSafe', () => {
  it('is true when the Safe has a multichain group', () => {
    const address = fakerChecksummedAddress()
    mockUseAllSafesGrouped.mockReturnValue({ allMultiChainSafes: [multichainGroup(address, ['1', '137'])] })
    mockUseSafeAddress.mockReturnValue(address.toLowerCase())

    const { result } = renderHook(() => useIsMultichainSafe())

    expect(result.current).toBe(true)
  })

  it('is false when the Safe exists on one network only', () => {
    mockUseAllSafesGrouped.mockReturnValue({
      allMultiChainSafes: [multichainGroup(fakerChecksummedAddress(), ['1', '137'])],
    })
    mockUseSafeAddress.mockReturnValue(fakerChecksummedAddress())

    const { result } = renderHook(() => useIsMultichainSafe())

    expect(result.current).toBe(false)
  })
})
