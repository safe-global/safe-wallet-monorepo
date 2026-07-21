import { renderHook, act } from '@testing-library/react'
import useTrustedSafesModal from './useTrustedSafesModal'
import * as store from '@/store'
import * as useAllSafes from '@/hooks/safes/useAllSafes'
import { OrderByOption, selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'

const mockSimilarityClusters = jest.fn(() => ({
  flagged: new Set<string>(),
  groupIdByAddress: new Map<string, string>(),
}))
jest.mock('@/features/address-poisoning', () => ({
  useSimilarityClusters: () => mockSimilarityClusters(),
}))

jest.mock('@/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}))

jest.mock('@/hooks/safes/useAllSafes', () => ({
  __esModule: true,
  default: jest.fn(),
}))

// Stub the Fuse search (covered by its own suite) with a deterministic substring filter.
jest.mock('@/hooks/safes/useSafesSearch', () => ({
  useSafesSearch: (items: Array<{ address: string; name?: string }>, query: string) =>
    query
      ? items.filter(
          (item) =>
            item.address.toLowerCase().includes(query.toLowerCase()) ||
            (item.name ? item.name.toLowerCase().includes(query.toLowerCase()) : false),
        )
      : [],
}))

describe('useTrustedSafesModal', () => {
  const mockDispatch = jest.fn()
  const mockSafes = [
    { chainId: '1', address: '0x1234567890abcdef1234567890abcdef12345678', name: 'Safe 1', isPinned: false },
    { chainId: '1', address: '0xabcdef1234567890abcdef1234567890abcdef12', name: 'Safe 2', isPinned: false },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(store.useAppDispatch as jest.Mock).mockReturnValue(mockDispatch)
    ;(store.useAppSelector as jest.Mock).mockReturnValue({})
    ;(useAllSafes.default as jest.Mock).mockReturnValue(mockSafes)
    mockSimilarityClusters.mockReturnValue({ flagged: new Set<string>(), groupIdByAddress: new Map<string, string>() })
  })

  it('should initialize with modal closed', () => {
    const { result } = renderHook(() => useTrustedSafesModal())

    expect(result.current.isOpen).toBe(false)
    expect(result.current.selectedAddresses.size).toBe(0)
  })

  it('should open modal', () => {
    const { result } = renderHook(() => useTrustedSafesModal())

    act(() => {
      result.current.open()
    })

    expect(result.current.isOpen).toBe(true)
  })

  it('should close modal', () => {
    const { result } = renderHook(() => useTrustedSafesModal())

    act(() => {
      result.current.open()
    })

    act(() => {
      result.current.close()
    })

    expect(result.current.isOpen).toBe(false)
  })

  it('should toggle selection', () => {
    const { result } = renderHook(() => useTrustedSafesModal())

    act(() => {
      result.current.toggleSelection(mockSafes[0].address)
    })

    expect(result.current.selectedAddresses.has(mockSafes[0].address.toLowerCase())).toBe(true)

    act(() => {
      result.current.toggleSelection(mockSafes[0].address)
    })

    expect(result.current.selectedAddresses.has(mockSafes[0].address.toLowerCase())).toBe(false)
  })

  it('should show pending confirmation for flagged address', () => {
    mockSimilarityClusters.mockReturnValue({
      flagged: new Set([mockSafes[0].address.toLowerCase()]),
      groupIdByAddress: new Map([[mockSafes[0].address.toLowerCase(), 'test']]),
    })

    const { result } = renderHook(() => useTrustedSafesModal())

    act(() => {
      result.current.toggleSelection(mockSafes[0].address)
    })

    expect(result.current.pendingConfirmation).toBe(mockSafes[0].address.toLowerCase())
  })

  it('should confirm similar address', () => {
    mockSimilarityClusters.mockReturnValue({
      flagged: new Set([mockSafes[0].address.toLowerCase()]),
      groupIdByAddress: new Map([[mockSafes[0].address.toLowerCase(), 'test']]),
    })

    const { result } = renderHook(() => useTrustedSafesModal())

    act(() => {
      result.current.toggleSelection(mockSafes[0].address)
    })

    act(() => {
      result.current.confirmSimilarAddress()
    })

    expect(result.current.pendingConfirmation).toBe(null)
    expect(result.current.selectedAddresses.has(mockSafes[0].address.toLowerCase())).toBe(true)
  })

  it('should filter safes by search query', () => {
    const { result } = renderHook(() => useTrustedSafesModal())

    act(() => {
      result.current.setSearchQuery('Safe 1')
    })

    expect(result.current.availableItems.length).toBe(1)
    expect(result.current.availableItems[0].name).toBe('Safe 1')
  })

  it('should dispatch actions on submit', () => {
    const { result } = renderHook(() => useTrustedSafesModal())

    act(() => {
      result.current.toggleSelection(mockSafes[0].address)
    })

    act(() => {
      result.current.submitSelection()
    })

    expect(mockDispatch).toHaveBeenCalled()
    expect(result.current.isOpen).toBe(false)
  })

  it('should pre-select pinned safes when opening modal', () => {
    const pinnedAddress = '0x1234567890abcdef1234567890abcdef12345678'
    ;(store.useAppSelector as jest.Mock).mockReturnValue({
      '1': { [pinnedAddress]: { owners: [], threshold: 1 } },
    })

    const { result } = renderHook(() => useTrustedSafesModal())

    act(() => {
      result.current.open()
    })

    expect(result.current.selectedAddresses.has(pinnedAddress.toLowerCase())).toBe(true)
  })

  it('should detect changes when deselecting pinned safe', () => {
    const pinnedAddress = '0x1234567890abcdef1234567890abcdef12345678'
    ;(store.useAppSelector as jest.Mock).mockReturnValue({
      '1': { [pinnedAddress]: { owners: [], threshold: 1 } },
    })

    const { result } = renderHook(() => useTrustedSafesModal())

    act(() => {
      result.current.open()
    })

    // Initially no changes (pinned safe is pre-selected)
    expect(result.current.hasChanges).toBe(false)

    // Deselect the pinned safe
    act(() => {
      result.current.toggleSelection(pinnedAddress)
    })

    // Now there are changes (safe will be unpinned)
    expect(result.current.hasChanges).toBe(true)
    expect(result.current.selectedAddresses.has(pinnedAddress.toLowerCase())).toBe(false)
  })

  it('should dispatch unpinSafe action when deselecting pinned safe and submitting', () => {
    const pinnedAddress = '0x1234567890abcdef1234567890abcdef12345678'
    ;(store.useAppSelector as jest.Mock).mockReturnValue({
      '1': { [pinnedAddress]: { owners: [], threshold: 1 } },
    })

    const { result } = renderHook(() => useTrustedSafesModal())

    act(() => {
      result.current.open()
    })

    // Deselect the pinned safe
    act(() => {
      result.current.toggleSelection(pinnedAddress)
    })

    act(() => {
      result.current.submitSelection()
    })

    // Verify unpinSafe was dispatched
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'addedSafes/unpinSafe',
        payload: { chainId: '1', address: pinnedAddress },
      }),
    )
  })

  it('unpins a deselected safe pinned on a chain absent from the current list', () => {
    // Pinned on chain 137, which is NOT among the safes returned by useAllSafes (config-scoped list).
    const pinnedAddress = '0xfeed000000000000000000000000000000001234'
    ;(store.useAppSelector as jest.Mock).mockReturnValue({
      '137': { [pinnedAddress]: { owners: [], threshold: 1 } },
    })

    const { result } = renderHook(() => useTrustedSafesModal())

    // Opens pre-selecting the pinned address (collected across all chains)…
    act(() => {
      result.current.open()
    })
    expect(result.current.selectedAddresses.has(pinnedAddress)).toBe(true)

    // …deselecting and saving must still unpin it, even though it's not in `useAllSafes`.
    act(() => {
      result.current.toggleSelection(pinnedAddress)
    })
    act(() => {
      result.current.submitSelection()
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'addedSafes/unpinSafe',
        payload: { chainId: '137', address: pinnedAddress },
      }),
    )
  })

  it('should select all safes when no similar addresses', () => {
    const { result } = renderHook(() => useTrustedSafesModal())

    act(() => {
      result.current.selectAll()
    })

    expect(result.current.selectedAddresses.size).toBe(mockSafes.length)
    expect(result.current.selectedAddresses.has(mockSafes[0].address.toLowerCase())).toBe(true)
    expect(result.current.selectedAddresses.has(mockSafes[1].address.toLowerCase())).toBe(true)
  })

  it('should show confirmation without changing selection when selecting all with similar addresses', () => {
    mockSimilarityClusters.mockReturnValue({
      flagged: new Set([mockSafes[0].address.toLowerCase()]),
      groupIdByAddress: new Map([[mockSafes[0].address.toLowerCase(), 'test']]),
    })

    const { result } = renderHook(() => useTrustedSafesModal())

    act(() => {
      result.current.selectAll()
    })

    expect(result.current.pendingSelectAllConfirmation).toBe(true)
    expect(result.current.selectedAddresses.size).toBe(0)
  })

  it('should select all including similar when confirmed', () => {
    mockSimilarityClusters.mockReturnValue({
      flagged: new Set([mockSafes[0].address.toLowerCase()]),
      groupIdByAddress: new Map([[mockSafes[0].address.toLowerCase(), 'test']]),
    })

    const { result } = renderHook(() => useTrustedSafesModal())

    act(() => {
      result.current.selectAll()
    })

    expect(result.current.pendingSelectAllConfirmation).toBe(true)

    act(() => {
      result.current.confirmSelectAll()
    })

    expect(result.current.pendingSelectAllConfirmation).toBe(false)
    expect(result.current.selectedAddresses.size).toBe(mockSafes.length)
  })

  it('should revert to the prior selection when select all cancelled', () => {
    mockSimilarityClusters.mockReturnValue({
      flagged: new Set([mockSafes[0].address.toLowerCase()]),
      groupIdByAddress: new Map([[mockSafes[0].address.toLowerCase(), 'test']]),
    })

    const { result } = renderHook(() => useTrustedSafesModal())

    act(() => {
      result.current.selectAll()
    })

    act(() => {
      result.current.cancelSelectAll()
    })

    expect(result.current.pendingSelectAllConfirmation).toBe(false)
    expect(result.current.selectedAddresses.size).toBe(0)
  })

  it('should select only non-similar safes when skipping similar addresses', () => {
    mockSimilarityClusters.mockReturnValue({
      flagged: new Set([mockSafes[0].address.toLowerCase()]),
      groupIdByAddress: new Map([[mockSafes[0].address.toLowerCase(), 'test']]),
    })

    const { result } = renderHook(() => useTrustedSafesModal())

    act(() => {
      result.current.selectAll()
    })

    act(() => {
      result.current.skipSimilarSelectAll()
    })

    expect(result.current.pendingSelectAllConfirmation).toBe(false)
    expect(result.current.selectedAddresses.has(mockSafes[0].address.toLowerCase())).toBe(false)
    expect(result.current.selectedAddresses.has(mockSafes[1].address.toLowerCase())).toBe(true)
  })

  it('should deselect all safes', () => {
    const { result } = renderHook(() => useTrustedSafesModal())

    // First select some safes
    act(() => {
      result.current.selectAll()
    })

    expect(result.current.selectedAddresses.size).toBe(mockSafes.length)

    // Deselect all
    act(() => {
      result.current.deselectAll()
    })

    expect(result.current.selectedAddresses.size).toBe(0)
  })

  describe('search-filtered selection', () => {
    it('scopes the counter to the visible safes', () => {
      const { result } = renderHook(() => useTrustedSafesModal())

      expect(result.current.totalSafesCount).toBe(mockSafes.length)

      act(() => {
        result.current.setSearchQuery('Safe 1')
      })

      expect(result.current.totalSafesCount).toBe(1)
    })

    it('selectAll only selects the visible safes', () => {
      const { result } = renderHook(() => useTrustedSafesModal())

      act(() => {
        result.current.setSearchQuery('Safe 1')
      })

      act(() => {
        result.current.selectAll()
      })

      expect(result.current.selectedAddresses.has(mockSafes[0].address.toLowerCase())).toBe(true)
      expect(result.current.selectedAddresses.has(mockSafes[1].address.toLowerCase())).toBe(false)
      expect(result.current.selectedCount).toBe(1)
      expect(result.current.allSelected).toBe(true)
    })

    it('deselectAll only clears the visible safes and keeps the rest selected', () => {
      const { result } = renderHook(() => useTrustedSafesModal())

      act(() => {
        result.current.selectAll()
      })

      act(() => {
        result.current.setSearchQuery('Safe 1')
      })

      act(() => {
        result.current.deselectAll()
      })

      expect(result.current.selectedAddresses.has(mockSafes[0].address.toLowerCase())).toBe(false)
      expect(result.current.selectedAddresses.has(mockSafes[1].address.toLowerCase())).toBe(true)
    })

    it('preserves selections made before searching', () => {
      const { result } = renderHook(() => useTrustedSafesModal())

      act(() => {
        result.current.toggleSelection(mockSafes[0].address)
      })

      act(() => {
        result.current.setSearchQuery('Safe 2')
      })

      expect(result.current.selectedAddresses.has(mockSafes[0].address.toLowerCase())).toBe(true)
    })
  })

  describe('hasChanges', () => {
    it('reports a pending pin that is hidden by the active search', () => {
      const { result } = renderHook(() => useTrustedSafesModal())

      act(() => {
        result.current.toggleSelection(mockSafes[0].address)
      })

      act(() => {
        result.current.setSearchQuery('Safe 2')
      })

      expect(result.current.hasChanges).toBe(true)
    })

    it('is false when the selection matches the pinned state', () => {
      const { result } = renderHook(() => useTrustedSafesModal())

      expect(result.current.hasChanges).toBe(false)
    })

    it('is false when an already-pinned, still-selected safe is hidden by the search', () => {
      const pinnedAddress = mockSafes[0].address
      ;(store.useAppSelector as jest.Mock).mockReturnValue({
        '1': { [pinnedAddress]: { owners: [], threshold: 1 } },
      })

      const { result } = renderHook(() => useTrustedSafesModal())

      act(() => {
        result.current.open()
      })

      act(() => {
        result.current.setSearchQuery('Safe 2')
      })

      expect(result.current.selectedAddresses.has(pinnedAddress.toLowerCase())).toBe(true)
      expect(result.current.hasChanges).toBe(false)
    })
  })

  describe('ordering', () => {
    const orderedSafes = [
      { chainId: '1', address: '0x1111111111111111111111111111111111111111', name: 'Zebra', lastVisited: 300 },
      { chainId: '1', address: '0x2222222222222222222222222222222222222222', name: 'Alpha', lastVisited: 100 },
      { chainId: '1', address: '0x3333333333333333333333333333333333333333', name: 'Mango', lastVisited: 200 },
    ]

    // Selector-aware mock so the global order preference can be varied per test.
    const mockOrderBy = (orderBy: OrderByOption) => {
      ;(store.useAppSelector as jest.Mock).mockImplementation((selector: unknown) => {
        if (selector === selectOrderByPreference) return { orderBy }
        if (selector === selectAllAddedSafes) return {}
        return undefined
      })
    }

    beforeEach(() => {
      ;(useAllSafes.default as jest.Mock).mockReturnValue(orderedSafes)
    })

    it('sorts by name (A→Z) when the preference is Name', () => {
      mockOrderBy(OrderByOption.NAME)
      const { result } = renderHook(() => useTrustedSafesModal())

      expect(result.current.availableItems.map((item) => item.name)).toEqual(['Alpha', 'Mango', 'Zebra'])
    })

    it('sorts by most recently visited when the preference is Last visited', () => {
      mockOrderBy(OrderByOption.LAST_VISITED)
      const { result } = renderHook(() => useTrustedSafesModal())

      expect(result.current.availableItems.map((item) => item.name)).toEqual(['Zebra', 'Mango', 'Alpha'])
    })
  })

  describe('multi-chain safes', () => {
    const multiChainAddress = '0xdddddddddddddddddddddddddddddddddddddddd'
    const multiChainSafes = [
      { chainId: '1', address: multiChainAddress, name: 'Multichain Safe', isPinned: false },
      { chainId: '137', address: multiChainAddress, name: 'Multichain Safe', isPinned: false },
    ]

    beforeEach(() => {
      ;(useAllSafes.default as jest.Mock).mockReturnValue(multiChainSafes)
    })

    it('groups same-address chains into a single selectable item', () => {
      const { result } = renderHook(() => useTrustedSafesModal())

      expect(result.current.availableItems).toHaveLength(1)
      expect(result.current.totalSafesCount).toBe(1)
    })

    it('toggling the group selects the shared address', () => {
      const { result } = renderHook(() => useTrustedSafesModal())

      act(() => {
        result.current.toggleSelection(multiChainAddress)
      })

      expect(result.current.selectedAddresses.has(multiChainAddress.toLowerCase())).toBe(true)
      expect(result.current.selectedCount).toBe(1)
    })

    it('submit dispatches addOrUpdateSafe once per chain', () => {
      const { result } = renderHook(() => useTrustedSafesModal())

      act(() => {
        result.current.toggleSelection(multiChainAddress)
      })

      act(() => {
        result.current.submitSelection()
      })

      const pinDispatches = mockDispatch.mock.calls.filter(([action]) => action?.type === 'addedSafes/addOrUpdateSafe')
      expect(pinDispatches).toHaveLength(2)
      const pinnedChainIds = pinDispatches.map(([action]) => action.payload.safe.chainId).sort()
      expect(pinnedChainIds).toEqual(['1', '137'])
    })
  })
})
