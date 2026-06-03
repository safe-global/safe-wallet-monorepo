import { renderHook } from '@testing-library/react'
import { useIsQualifiedSafe, useSpaceSafes } from '@/features/spaces'
import { useAllSafes } from '@/hooks/safes'
import type { SafeItem } from '@/hooks/safes'
import { useAccountsModalItems } from './useAccountsModalItems'

jest.mock('@/features/spaces', () => ({
  useIsQualifiedSafe: jest.fn(),
  useSpaceSafes: jest.fn(),
}))

jest.mock('@/hooks/safes', () => {
  const actual = jest.requireActual('@/hooks/safes')
  return {
    ...actual,
    useAllSafes: jest.fn(),
    // Real useAllSafesGrouped internally calls useAllSafes (unmocked path), which needs
    // Redux/RTK context. Replace it with a pure delegate over the customSafes arg.
    // Plain function (not jest.fn) so jest.resetAllMocks() doesn't wipe the implementation.
    useAllSafesGrouped: (customSafes = []) => {
      const allMultiChainSafes = actual._getMultiChainAccounts(customSafes)
      const allSingleSafes = actual._getSingleChainAccounts(customSafes, allMultiChainSafes)
      return { allMultiChainSafes, allSingleSafes }
    },
  }
})

jest.mock('@/hooks/wallets/useWallet', () => () => ({ address: '' }))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/owners', () => ({
  useOwnersGetAllSafesByOwnerV2Query: () => ({ error: undefined, refetch: jest.fn() }),
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: () => ({}),
}))

const mockUseIsQualifiedSafe = useIsQualifiedSafe as jest.Mock
const mockUseSpaceSafes = useSpaceSafes as jest.Mock
const mockUseAllSafes = useAllSafes as jest.Mock

const safeItem = (chainId: string, address: string, overrides: Partial<SafeItem> = {}): SafeItem => ({
  chainId,
  address,
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
  ...overrides,
})

const ADDR_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const ADDR_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

describe('useAccountsModalItems', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockUseSpaceSafes.mockReturnValue({ allSafes: [] })
    mockUseIsQualifiedSafe.mockReturnValue(false)
  })

  it('splits items into trusted (pinned) and other (non-pinned)', () => {
    mockUseAllSafes.mockReturnValue([
      safeItem('1', ADDR_A, { isPinned: true }),
      safeItem('1', ADDR_B, { isPinned: false }),
    ])

    const { result } = renderHook(() => useAccountsModalItems({ search: '', open: true }))

    expect(result.current.trustedItems).toHaveLength(1)
    expect(result.current.otherItems).toHaveLength(1)
    expect((result.current.trustedItems[0] as SafeItem).address).toBe(ADDR_A)
    expect((result.current.otherItems[0] as SafeItem).address).toBe(ADDR_B)
  })

  it('reports isLoading when useAllSafes returns undefined', () => {
    mockUseAllSafes.mockReturnValue(undefined)

    const { result } = renderHook(() => useAccountsModalItems({ search: '', open: true }))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.trustedItems).toHaveLength(0)
    expect(result.current.otherItems).toHaveLength(0)
  })

  it('filters out safes already in the current space by exact (chainId, address) match', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)
    mockUseAllSafes.mockReturnValue([safeItem('1', ADDR_A), safeItem('100', ADDR_A), safeItem('1', ADDR_B)])
    // Space contains ADDR_A on chain 1 only.
    mockUseSpaceSafes.mockReturnValue({
      allSafes: [safeItem('1', ADDR_A)],
    })

    const { result } = renderHook(() => useAccountsModalItems({ search: '', open: true }))

    const addresses = result.current.otherItems.map((item) => `${(item as SafeItem).chainId}:${item.address}`)
    expect(addresses).toEqual(expect.arrayContaining([`100:${ADDR_A}`, `1:${ADDR_B}`]))
    expect(addresses).not.toContain(`1:${ADDR_A}`)
  })

  it('does not filter when isQualifiedSafe is false even if useSpaceSafes returns items (defensive)', () => {
    mockUseIsQualifiedSafe.mockReturnValue(false)
    mockUseAllSafes.mockReturnValue([safeItem('1', ADDR_A)])
    mockUseSpaceSafes.mockReturnValue({ allSafes: [safeItem('1', ADDR_A)] })

    const { result } = renderHook(() => useAccountsModalItems({ search: '', open: true }))

    expect(result.current.otherItems).toHaveLength(1)
  })

  it('exposes isQualifiedSafe so callers do not need to call useIsQualifiedSafe themselves', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)
    mockUseAllSafes.mockReturnValue([safeItem('1', ADDR_A)])

    const { result } = renderHook(() => useAccountsModalItems({ search: '', open: true }))

    expect(result.current.isQualifiedSafe).toBe(true)
  })

  it('applies search by name and address substring', () => {
    mockUseAllSafes.mockReturnValue([
      safeItem('1', ADDR_A, { name: 'Treasury Safe' }),
      safeItem('1', ADDR_B, { name: 'Side Vault' }),
    ])

    const { result, rerender } = renderHook(({ search }) => useAccountsModalItems({ search, open: true }), {
      initialProps: { search: 'treasury' },
    })
    expect(result.current.otherItems).toHaveLength(1)
    expect((result.current.otherItems[0] as SafeItem).name).toBe('Treasury Safe')

    rerender({ search: ADDR_B.slice(2, 6) })
    expect(result.current.otherItems).toHaveLength(1)
    expect((result.current.otherItems[0] as SafeItem).address).toBe(ADDR_B)

    rerender({ search: 'nope' })
    expect(result.current.otherItems).toHaveLength(0)
  })
})
