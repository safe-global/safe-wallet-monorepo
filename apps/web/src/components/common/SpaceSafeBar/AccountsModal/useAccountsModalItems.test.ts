import { renderHook } from '@testing-library/react'
import { useIsQualifiedSafe, useSpaceSafes } from '@/features/spaces'
import { useAllSafes, isMultiChainSafeItem } from '@/hooks/safes'
import type { SafeItem } from '@/hooks/safes'
import { useOwnersGetAllSafesByOwnerV2Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { useAppDispatch } from '@/store'
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
  useOwnersGetAllSafesByOwnerV2Query: jest.fn(() => ({ error: undefined, refetch: jest.fn() })),
}))

// Plain let (not jest.fn) so jest.resetAllMocks() doesn't wipe it; controls the order preference.
let mockOrderBy = 'name'
jest.mock('@/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: () => ({ orderBy: mockOrderBy }),
}))

const mockUseIsQualifiedSafe = useIsQualifiedSafe as jest.Mock
const mockUseSpaceSafes = useSpaceSafes as jest.Mock
const mockUseAllSafes = useAllSafes as jest.Mock
const mockUseOwnersQuery = useOwnersGetAllSafesByOwnerV2Query as unknown as jest.Mock
const mockUseAppDispatch = useAppDispatch as unknown as jest.Mock

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
    mockOrderBy = 'name'
    mockUseSpaceSafes.mockReturnValue({ allSafes: [] })
    mockUseIsQualifiedSafe.mockReturnValue(false)
    mockUseOwnersQuery.mockReturnValue({ error: undefined, refetch: jest.fn() })
    mockUseAppDispatch.mockReturnValue(jest.fn())
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

  it('reports isLoading=true in workspace context while space safes are still loading', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)
    mockUseAllSafes.mockReturnValue([safeItem('1', ADDR_A)])
    mockUseSpaceSafes.mockReturnValue({ allSafes: [], isLoading: true })

    const { result } = renderHook(() => useAccountsModalItems({ search: '', open: true }))

    expect(result.current.isLoading).toBe(true)
  })

  it('does not gate on space-safes loading outside workspace context', () => {
    mockUseIsQualifiedSafe.mockReturnValue(false)
    mockUseAllSafes.mockReturnValue([safeItem('1', ADDR_A)])
    mockUseSpaceSafes.mockReturnValue({ allSafes: [], isLoading: true })

    const { result } = renderHook(() => useAccountsModalItems({ search: '', open: true }))

    expect(result.current.isLoading).toBe(false)
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

  it('degrades a multi-chain safe to single-chain when one of its chains is in the workspace', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)
    // ADDR_A is on chains 1 + 100 → would normally group as multi-chain.
    mockUseAllSafes.mockReturnValue([safeItem('1', ADDR_A), safeItem('100', ADDR_A)])
    // Workspace contains ADDR_A on chain 1 → chain 1 is excluded, only chain 100 remains.
    mockUseSpaceSafes.mockReturnValue({
      allSafes: [safeItem('1', ADDR_A)],
    })

    const { result } = renderHook(() => useAccountsModalItems({ search: '', open: true }))

    expect(result.current.otherItems).toHaveLength(1)
    const survivor = result.current.otherItems[0]
    // After filtering, only one chain instance remains → must be a single-chain SafeItem, not multi.
    expect(isMultiChainSafeItem(survivor)).toBe(false)
    expect((survivor as SafeItem).chainId).toBe('100')
    expect(survivor.address).toBe(ADDR_A)
  })

  it('does not dispatch the owned-safes error notification while the modal is closed', () => {
    const dispatch = jest.fn()
    mockUseAppDispatch.mockReturnValue(dispatch)
    mockUseOwnersQuery.mockReturnValue({ error: { status: 500 }, refetch: jest.fn() })
    mockUseAllSafes.mockReturnValue([safeItem('1', ADDR_A)])

    renderHook(() => useAccountsModalItems({ search: '', open: false }))

    expect(dispatch).not.toHaveBeenCalled()
  })

  it('dispatches the owned-safes error notification when the modal is open and the query errors', () => {
    const dispatch = jest.fn()
    mockUseAppDispatch.mockReturnValue(dispatch)
    mockUseOwnersQuery.mockReturnValue({ error: { status: 500 }, refetch: jest.fn() })
    mockUseAllSafes.mockReturnValue([safeItem('1', ADDR_A)])

    renderHook(() => useAccountsModalItems({ search: '', open: true }))

    expect(dispatch).toHaveBeenCalledTimes(1)
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

  it('sorts within the trusted section A→Z when ordering by Name', () => {
    mockOrderBy = 'name'
    mockUseAllSafes.mockReturnValue([
      safeItem('1', ADDR_A, { isPinned: true, name: 'Zeta' }),
      safeItem('1', ADDR_B, { isPinned: true, name: 'Alpha' }),
    ])

    const { result } = renderHook(() => useAccountsModalItems({ search: '', open: true }))

    expect(result.current.trustedItems.map((s) => (s as SafeItem).name)).toEqual(['Alpha', 'Zeta'])
  })

  it('sorts within the trusted section by most-recent when ordering by Last visited', () => {
    mockOrderBy = 'lastVisited'
    mockUseAllSafes.mockReturnValue([
      safeItem('1', ADDR_A, { isPinned: true, name: 'Older', lastVisited: 100 }),
      safeItem('1', ADDR_B, { isPinned: true, name: 'Newer', lastVisited: 200 }),
    ])

    const { result } = renderHook(() => useAccountsModalItems({ search: '', open: true }))

    expect(result.current.trustedItems.map((s) => (s as SafeItem).name)).toEqual(['Newer', 'Older'])
  })
})
