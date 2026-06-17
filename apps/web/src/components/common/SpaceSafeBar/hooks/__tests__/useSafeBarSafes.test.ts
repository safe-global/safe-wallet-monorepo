import { renderHook } from '@testing-library/react'
import { _useWorkspaceBarSafes, _useGlobalBarSafes } from '../useSafeBarSafes'
import type { SafeItem, MultiChainSafeItem } from '@/hooks/safes'
import type { AllSafeItems } from '@/hooks/safes'

// ── mocks ──────────────────────────────────────────────────────────────

const mockSpaceSafes: AllSafeItems = []
const mockUseSpaceSafes = jest.fn(() => ({ allSafes: mockSpaceSafes }))

jest.mock('@/features/spaces', () => ({
  useSpaceSafes: () => mockUseSpaceSafes(),
}))

const mockSafeAddress = jest.fn(() => '0xCurrentSafe')
jest.mock('@/hooks/useSafeAddressFromUrl', () => ({
  useSafeAddressFromUrl: () => mockSafeAddress(),
}))

const mockReduxSafeAddress = jest.fn(() => '')
jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safeAddress: mockReduxSafeAddress() }),
}))

const mockChainId = jest.fn(() => '1')
jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: () => mockChainId(),
}))

const mockAllSafes = jest.fn<SafeItem[] | undefined, []>(() => undefined)
const mockGrouped = jest.fn<{ allMultiChainSafes: MultiChainSafeItem[]; allSingleSafes: SafeItem[] }, [SafeItem[]]>(
  (items: SafeItem[]) => ({
    allMultiChainSafes: [],
    allSingleSafes: items,
  }),
)
jest.mock('@/hooks/safes', () => ({
  useAllSafes: () => mockAllSafes(),
  useAllSafesGrouped: (items: SafeItem[]) => mockGrouped(items),
  // Real comparator so ordering is exercised; types are erased at runtime.
  getComparator: jest.requireActual('@/hooks/safes/comparators').getComparator,
}))

const mockOrderBy = jest.fn(() => 'name')
jest.mock('@/store', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ orderByPreference: { orderBy: mockOrderBy() } }),
}))

// ── helpers ────────────────────────────────────────────────────────────

const createSafe = (address: string, isPinned = false, chainId = '1'): SafeItem => ({
  address,
  chainId,
  isPinned,
  isReadOnly: false,
  lastVisited: 0,
  name: undefined,
})

const resetMocks = () => {
  jest.clearAllMocks()
  mockSafeAddress.mockReturnValue('0xCurrentSafe')
  mockReduxSafeAddress.mockReturnValue('')
  mockChainId.mockReturnValue('1')
  mockOrderBy.mockReturnValue('name')
  mockAllSafes.mockReturnValue(undefined)
  mockUseSpaceSafes.mockReturnValue({ allSafes: [] })
  // Default: pass-through. Tests needing multi-chain grouping override per-case.
  mockGrouped.mockImplementation((items: SafeItem[]) => ({
    allMultiChainSafes: [],
    allSingleSafes: items,
  }))
}

// ── workspace switcher (space safes; never enumerates owned safes) ────────

describe('useWorkspaceBarSafes', () => {
  beforeEach(resetMocks)

  // The workspace path must not reach the owned-safes enumeration: it does not depend on
  // `useAllSafes` at all.
  it('never enumerates owned safes', () => {
    const spaceSafe = createSafe('0xSpaceSafe', true)
    mockUseSpaceSafes.mockReturnValue({ allSafes: [spaceSafe] })
    mockSafeAddress.mockReturnValue('0xSpaceSafe')

    renderHook(() => _useWorkspaceBarSafes())

    expect(mockAllSafes).not.toHaveBeenCalled()
    expect(mockGrouped).not.toHaveBeenCalled()
  })

  it('returns the space safes for both lists', () => {
    const spaceSafe = createSafe('0xSpaceSafe', true)
    mockUseSpaceSafes.mockReturnValue({ allSafes: [spaceSafe] })
    mockSafeAddress.mockReturnValue('0xSpaceSafe')

    const { result } = renderHook(() => _useWorkspaceBarSafes())

    expect(result.current.isInSpaceContext).toBe(true)
    expect(result.current.dropdownSafes).toEqual([spaceSafe])
    expect(result.current.chainSelectorSafes).toEqual([spaceSafe])
  })

  it('injects a fallback current safe when it is not part of the space', () => {
    const spaceSafe = createSafe('0xSpaceSafe', true)
    mockUseSpaceSafes.mockReturnValue({ allSafes: [spaceSafe] })
    mockSafeAddress.mockReturnValue('0xOutsideSafe')
    mockChainId.mockReturnValue('11155111')

    const { result } = renderHook(() => _useWorkspaceBarSafes())

    expect(result.current.dropdownSafes).toHaveLength(2)
    expect(result.current.dropdownSafes[0].address).toBe('0xOutsideSafe')
    expect(result.current.dropdownSafes[1].address).toBe('0xSpaceSafe')
  })

  it('returns the space list as-is when there is no current safe', () => {
    const spaceSafe = createSafe('0xSpaceSafe', true)
    mockUseSpaceSafes.mockReturnValue({ allSafes: [spaceSafe] })
    mockSafeAddress.mockReturnValue('')
    mockReduxSafeAddress.mockReturnValue('')

    const { result } = renderHook(() => _useWorkspaceBarSafes())

    expect(result.current.dropdownSafes).toEqual([spaceSafe])
  })
})

// ── global account switcher (owned-safes enumeration) ────────────────────

describe('useGlobalBarSafes', () => {
  beforeEach(resetMocks)

  it('enumerates owned safes', () => {
    mockAllSafes.mockReturnValue([])

    renderHook(() => _useGlobalBarSafes())

    expect(mockAllSafes).toHaveBeenCalled()
  })

  it('returns empty lists when allSafes is undefined', () => {
    mockAllSafes.mockReturnValue(undefined)

    const { result } = renderHook(() => _useGlobalBarSafes())

    expect(result.current.isInSpaceContext).toBe(false)
    // dropdownSafes should contain only the fallback current safe
    expect(result.current.dropdownSafes).toHaveLength(1)
    expect(result.current.dropdownSafes[0].address).toBe('0xCurrentSafe')
  })

  it('returns pinned safes for dropdown', () => {
    const pinned = createSafe('0xPinned', true)
    const unpinned = createSafe('0xUnpinned', false)
    mockAllSafes.mockReturnValue([pinned, unpinned])
    mockSafeAddress.mockReturnValue('0xPinned')

    const { result } = renderHook(() => _useGlobalBarSafes())

    // dropdown should have pinned safe (current safe is already pinned, no injection)
    expect(result.current.dropdownSafes).toHaveLength(1)
    expect(result.current.dropdownSafes[0].address).toBe('0xPinned')
  })

  it('returns all known safes for chain selector', () => {
    const pinned = createSafe('0xPinned', true)
    const unpinned = createSafe('0xUnpinned', false)
    mockAllSafes.mockReturnValue([pinned, unpinned])
    mockSafeAddress.mockReturnValue('0xPinned')

    const { result } = renderHook(() => _useGlobalBarSafes())

    expect(result.current.chainSelectorSafes).toHaveLength(2)
  })

  it('injects current safe into dropdownSafes when not pinned but in allKnownSafes', () => {
    const pinned = createSafe('0xPinned', true)
    const current = createSafe('0xCurrentSafe', false)
    mockAllSafes.mockReturnValue([pinned, current])
    mockSafeAddress.mockReturnValue('0xCurrentSafe')

    const { result } = renderHook(() => _useGlobalBarSafes())

    // Current safe should be injected at the front
    expect(result.current.dropdownSafes).toHaveLength(2)
    expect(result.current.dropdownSafes[0].address).toBe('0xCurrentSafe')
    expect(result.current.dropdownSafes[1].address).toBe('0xPinned')
  })

  it('creates fallback SafeItem when current safe is not in any list', () => {
    const pinned = createSafe('0xPinned', true)
    mockAllSafes.mockReturnValue([pinned])
    mockSafeAddress.mockReturnValue('0xUnknownSafe')
    mockChainId.mockReturnValue('11155111')

    const { result } = renderHook(() => _useGlobalBarSafes())

    // Fallback should be injected
    expect(result.current.dropdownSafes).toHaveLength(2)
    const fallback = result.current.dropdownSafes[0] as SafeItem
    expect(fallback.address).toBe('0xUnknownSafe')
    expect(fallback.chainId).toBe('11155111')
    expect(fallback.isReadOnly).toBe(true)
    expect(fallback.isPinned).toBe(false)
  })

  it('keeps URL fallback at index 0 even when other pinned safes exist', () => {
    const pinnedA = createSafe('0xPinnedA', true)
    const pinnedB = createSafe('0xPinnedB', true)
    mockAllSafes.mockReturnValue([pinnedA, pinnedB])
    mockSafeAddress.mockReturnValue('0xNestedChild')
    mockChainId.mockReturnValue('11155111')

    const { result } = renderHook(() => _useGlobalBarSafes())

    expect(result.current.dropdownSafes).toHaveLength(3)
    expect(result.current.dropdownSafes[0].address).toBe('0xNestedChild')
    expect(result.current.dropdownSafes[1].address).toBe('0xPinnedA')
    expect(result.current.dropdownSafes[2].address).toBe('0xPinnedB')
  })

  it('injects fallback into chainSelectorSafes when not in allKnownSafes', () => {
    mockAllSafes.mockReturnValue([])
    mockSafeAddress.mockReturnValue('0xUnknownSafe')
    mockChainId.mockReturnValue('1')

    const { result } = renderHook(() => _useGlobalBarSafes())

    expect(result.current.chainSelectorSafes).toHaveLength(1)
    expect(result.current.chainSelectorSafes[0].address).toBe('0xUnknownSafe')
  })

  it('does not duplicate current safe if already pinned', () => {
    const pinned = createSafe('0xCurrentSafe', true)
    mockAllSafes.mockReturnValue([pinned])
    mockSafeAddress.mockReturnValue('0xCurrentSafe')

    const { result } = renderHook(() => _useGlobalBarSafes())

    expect(result.current.dropdownSafes).toHaveLength(1)
    expect(result.current.dropdownSafes[0].address).toBe('0xCurrentSafe')
  })

  it('does not duplicate current safe in chainSelectorSafes if already in allKnownSafes', () => {
    const safe = createSafe('0xCurrentSafe', false)
    mockAllSafes.mockReturnValue([safe])
    mockSafeAddress.mockReturnValue('0xCurrentSafe')

    const { result } = renderHook(() => _useGlobalBarSafes())

    expect(result.current.chainSelectorSafes).toHaveLength(1)
  })

  it('returns pinnedSafes as-is when both URL and Redux are empty', () => {
    const pinned = createSafe('0xPinned', true)
    mockAllSafes.mockReturnValue([pinned])
    mockSafeAddress.mockReturnValue('')
    mockReduxSafeAddress.mockReturnValue('')

    const { result } = renderHook(() => _useGlobalBarSafes())

    expect(result.current.dropdownSafes).toHaveLength(1)
    expect(result.current.dropdownSafes[0].address).toBe('0xPinned')
  })

  it('falls back to Redux safeAddress when URL has no safe param', () => {
    const pinned = createSafe('0xPinned', true)
    mockAllSafes.mockReturnValue([pinned])
    mockSafeAddress.mockReturnValue('')
    mockReduxSafeAddress.mockReturnValue('0xFromRedux')
    mockChainId.mockReturnValue('1')

    const { result } = renderHook(() => _useGlobalBarSafes())

    expect(result.current.dropdownSafes).toHaveLength(2)
    expect(result.current.dropdownSafes[0].address).toBe('0xFromRedux')
    expect(result.current.dropdownSafes[1].address).toBe('0xPinned')
  })

  it('prefers URL safeAddress over Redux when both are present', () => {
    const pinned = createSafe('0xPinned', true)
    mockAllSafes.mockReturnValue([pinned])
    mockSafeAddress.mockReturnValue('0xFromUrl')
    mockReduxSafeAddress.mockReturnValue('0xFromRedux')

    const { result } = renderHook(() => _useGlobalBarSafes())

    expect(result.current.dropdownSafes[0].address).toBe('0xFromUrl')
  })

  it('prefers allKnownSafes entry over fallback for injection', () => {
    const knownSafe = createSafe('0xCurrentSafe', false)
    knownSafe.name = 'Known Name'
    mockAllSafes.mockReturnValue([knownSafe])
    mockSafeAddress.mockReturnValue('0xCurrentSafe')

    const { result } = renderHook(() => _useGlobalBarSafes())

    // Should use the real entry from allKnownSafes, not the fallback
    const injected = result.current.dropdownSafes[0] as SafeItem
    expect(injected.name).toBe('Known Name')
    expect(injected.isReadOnly).toBe(false)
  })

  const groupByAddress = (items: SafeItem[]) => {
    const byAddress: Record<string, SafeItem[]> = {}
    for (const s of items) {
      ;(byAddress[s.address] ??= []).push(s)
    }
    const allMultiChainSafes: MultiChainSafeItem[] = Object.entries(byAddress)
      .filter(([, group]) => group.length > 1)
      .map(([address, group]) => ({
        address,
        safes: group,
        isPinned: group.some((s) => s.isPinned),
        lastVisited: 0,
        name: undefined,
      }))
    const multiAddresses = new Set(allMultiChainSafes.map((m) => m.address))
    const allSingleSafes = items.filter((s) => !multiAddresses.has(s.address))
    return { allMultiChainSafes, allSingleSafes }
  }

  // A wallet may own a safe on more chains than it has pinned; the current safe
  // row must reflect all of them.
  it('uses multi-chain representation of current safe even when only one chain is pinned', () => {
    const sepoliaPinned = createSafe('0xMultiSafe', true, '11155111')
    const mainnetOwned = createSafe('0xMultiSafe', false, '1')
    mockAllSafes.mockReturnValue([sepoliaPinned, mainnetOwned])
    mockSafeAddress.mockReturnValue('0xMultiSafe')
    mockGrouped.mockImplementation(groupByAddress)

    const { result } = renderHook(() => _useGlobalBarSafes())

    // Current safe row should reflect both chains so the user can switch.
    expect(result.current.dropdownSafes).toHaveLength(1)
    const item = result.current.dropdownSafes[0] as MultiChainSafeItem
    expect(item.address).toBe('0xMultiSafe')
    expect('safes' in item).toBe(true)
    expect(item.safes.map((s) => s.chainId).sort()).toEqual(['1', '11155111'])
  })

  it('keeps other pinned safes alongside the multi-chain current safe', () => {
    const sepoliaPinned = createSafe('0xMultiSafe', true, '11155111')
    const mainnetOwned = createSafe('0xMultiSafe', false, '1')
    const otherPinned = createSafe('0xOtherPinned', true, '1')
    mockAllSafes.mockReturnValue([sepoliaPinned, mainnetOwned, otherPinned])
    mockSafeAddress.mockReturnValue('0xMultiSafe')
    mockGrouped.mockImplementation(groupByAddress)

    const { result } = renderHook(() => _useGlobalBarSafes())

    expect(result.current.dropdownSafes).toHaveLength(2)
    const current = result.current.dropdownSafes[0] as MultiChainSafeItem
    expect(current.address).toBe('0xMultiSafe')
    expect(current.safes).toHaveLength(2)
    expect(result.current.dropdownSafes[1].address).toBe('0xOtherPinned')
  })

  it('sorts the non-current safes alphabetically when ordering by Name', () => {
    mockOrderBy.mockReturnValue('name')
    const current = createSafe('0xCurrent', false)
    const zeta = { ...createSafe('0xZeta', true), name: 'Zeta' }
    const alpha = { ...createSafe('0xAlpha', true), name: 'Alpha' }
    mockAllSafes.mockReturnValue([current, zeta, alpha])
    mockSafeAddress.mockReturnValue('0xCurrent')

    const { result } = renderHook(() => _useGlobalBarSafes())

    // Current first, then the rest A→Z.
    expect(result.current.dropdownSafes.map((s) => s.address)).toEqual(['0xCurrent', '0xAlpha', '0xZeta'])
  })

  it('sorts the non-current safes by most-recent when ordering by Last visited', () => {
    mockOrderBy.mockReturnValue('lastVisited')
    const current = createSafe('0xCurrent', false)
    const older = { ...createSafe('0xOlder', true), lastVisited: 100 }
    const newer = { ...createSafe('0xNewer', true), lastVisited: 200 }
    mockAllSafes.mockReturnValue([current, older, newer])
    mockSafeAddress.mockReturnValue('0xCurrent')

    const { result } = renderHook(() => _useGlobalBarSafes())

    // Current first, then most-recently-visited first.
    expect(result.current.dropdownSafes.map((s) => s.address)).toEqual(['0xCurrent', '0xNewer', '0xOlder'])
  })
})
