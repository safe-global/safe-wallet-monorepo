import { renderHook, act } from '@testing-library/react'
import useTrustedSafesModal from './useTrustedSafesModal'
import * as store from '@/store'
import * as useAllSafes from '@/hooks/safes/useAllSafes'
import * as addressSimilarity from '@safe-global/utils/utils/addressSimilarity'

jest.mock('@/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}))

jest.mock('@/hooks/safes/useAllSafes', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@safe-global/utils/utils/addressSimilarity', () => ({
  detectSimilarAddresses: jest.fn(),
  normalizeAddress: (address: string) => address.trim().toLowerCase().replace(/^0x/, ''),
}))

const mockUseListSimilarities = jest.fn()
jest.mock('@/features/address-poisoning', () => ({
  useListSimilarities: (addresses: string[]) => mockUseListSimilarities(addresses),
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
    mockUseListSimilarities.mockReturnValue(new Map())
    ;(addressSimilarity.detectSimilarAddresses as jest.Mock).mockReturnValue({
      groups: [],
      addressToGroups: new Map(),
      isFlagged: () => false,
      getGroup: () => undefined,
    })
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
    ;(addressSimilarity.detectSimilarAddresses as jest.Mock).mockReturnValue({
      groups: [],
      addressToGroups: new Map(),
      isFlagged: (addr: string) => addr === mockSafes[0].address,
      getGroup: () => ({ bucketKey: 'test', addresses: [], hasKnownAddress: true, riskLevel: 'high' }),
    })

    const { result } = renderHook(() => useTrustedSafesModal())

    act(() => {
      result.current.toggleSelection(mockSafes[0].address)
    })

    expect(result.current.pendingConfirmation).toBe(mockSafes[0].address.toLowerCase())
  })

  it('should confirm similar address', () => {
    ;(addressSimilarity.detectSimilarAddresses as jest.Mock).mockReturnValue({
      groups: [],
      addressToGroups: new Map(),
      isFlagged: (addr: string) => addr === mockSafes[0].address,
      getGroup: () => ({ bucketKey: 'test', addresses: [], hasKnownAddress: true, riskLevel: 'high' }),
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
    ;(addressSimilarity.detectSimilarAddresses as jest.Mock).mockReturnValue({
      groups: [],
      addressToGroups: new Map(),
      isFlagged: (addr: string) => addr === mockSafes[0].address,
      getGroup: () => ({ bucketKey: 'test', addresses: [], hasKnownAddress: true, riskLevel: 'high' }),
    })

    const { result } = renderHook(() => useTrustedSafesModal())

    act(() => {
      result.current.selectAll()
    })

    expect(result.current.pendingSelectAllConfirmation).toBe(true)
    expect(result.current.selectedAddresses.size).toBe(0)
  })

  it('should select all including similar when confirmed', () => {
    ;(addressSimilarity.detectSimilarAddresses as jest.Mock).mockReturnValue({
      groups: [],
      addressToGroups: new Map(),
      isFlagged: (addr: string) => addr === mockSafes[0].address,
      getGroup: () => ({ bucketKey: 'test', addresses: [], hasKnownAddress: true, riskLevel: 'high' }),
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
    ;(addressSimilarity.detectSimilarAddresses as jest.Mock).mockReturnValue({
      groups: [],
      addressToGroups: new Map(),
      isFlagged: (addr: string) => addr === mockSafes[0].address,
      getGroup: () => ({ bucketKey: 'test', addresses: [], hasKnownAddress: true, riskLevel: 'high' }),
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
    ;(addressSimilarity.detectSimilarAddresses as jest.Mock).mockReturnValue({
      groups: [],
      addressToGroups: new Map(),
      isFlagged: (addr: string) => addr === mockSafes[0].address,
      getGroup: () => ({ bucketKey: 'test', addresses: [], hasKnownAddress: true, riskLevel: 'high' }),
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

  describe('anchor detection (layered on intra-list)', () => {
    const IMPOSTOR = mockSafes[0].address
    const ANCHOR = mockSafes[1].address
    const anchorNorm = ANCHOR.toLowerCase().slice(2)

    beforeEach(() => {
      const map = new Map()
      map.set(IMPOSTOR, {
        address: IMPOSTOR,
        match: { anchor: anchorNorm, prefixLen: 1, suffixLen: 5, severity: 'WARN' },
      })
      map.set(ANCHOR, { address: ANCHOR })
      mockUseListSimilarities.mockReturnValue(map)
    })

    it('groups the impostor and the in-list imitated anchor under one key', () => {
      const { result } = renderHook(() => useTrustedSafesModal())

      const byAddress = new Map(result.current.availableItems.map((item) => [item.address, item]))
      const impostorGroup = byAddress.get(IMPOSTOR)?.similarityGroup
      // union-find: impostor and the in-list imitated anchor share one group key
      expect(impostorGroup).toBeTruthy()
      expect(byAddress.get(ANCHOR)?.similarityGroup).toBe(impostorGroup)
    })

    it('collapses an intra-list pair and an anchor-only match into ONE group (union-find)', () => {
      // REAL (in list) is imitated by CRIT (front+back → also an intra sibling of REAL) and by
      // WARN (back only → anchor edge). All three must land in a single group.
      const REAL = mockSafes[1].address
      const realNorm = REAL.toLowerCase().slice(2)
      const CRIT = '0x' + REAL.slice(2, 6) + '1'.repeat(31) + REAL.slice(-5)
      const WARN = '0x' + '9999' + '2'.repeat(31) + REAL.slice(-5)
      ;(useAllSafes.default as jest.Mock).mockReturnValue([
        { chainId: '1', address: REAL, name: 'Real' },
        { chainId: '1', address: CRIT, name: 'Crit' },
        { chainId: '1', address: WARN, name: 'Warn' },
      ])
      ;(addressSimilarity.detectSimilarAddresses as jest.Mock).mockReturnValue({
        groups: [],
        addressToGroups: new Map(),
        isFlagged: (a: string) => [REAL, CRIT].some((x) => x.toLowerCase() === a.toLowerCase()),
        getGroup: (a: string) =>
          [REAL, CRIT].some((x) => x.toLowerCase() === a.toLowerCase())
            ? { bucketKey: 'bkt', addresses: [REAL, CRIT], hasKnownAddress: false, riskLevel: 'high' }
            : undefined,
      })
      const map = new Map()
      map.set(CRIT, { address: CRIT, match: { anchor: realNorm, prefixLen: 4, suffixLen: 5, severity: 'CRITICAL' } })
      map.set(WARN, { address: WARN, match: { anchor: realNorm, prefixLen: 1, suffixLen: 5, severity: 'WARN' } })
      map.set(REAL, { address: REAL })
      mockUseListSimilarities.mockReturnValue(map)

      const { result } = renderHook(() => useTrustedSafesModal())
      const keys = result.current.availableItems.map((i) => i.similarityGroup)
      expect(new Set(keys).size).toBe(1)
      expect(keys.every(Boolean)).toBe(true)
    })

    it('gates selecting the impostor but not the trusted original', () => {
      const { result } = renderHook(() => useTrustedSafesModal())

      act(() => {
        result.current.toggleSelection(IMPOSTOR)
      })
      expect(result.current.pendingConfirmation).toBe(IMPOSTOR.toLowerCase())

      act(() => {
        result.current.cancelSimilarAddress()
        result.current.toggleSelection(ANCHOR)
      })
      expect(result.current.pendingConfirmation).toBe(null)
      expect(result.current.selectedAddresses.has(ANCHOR.toLowerCase())).toBe(true)
    })
  })
})
