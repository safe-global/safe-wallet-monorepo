import { renderHook, act } from '@testing-library/react'
import useSafeSelectionModal from './useSafeSelectionModal'
import * as store from '@/store'
import * as useAllSafes from '@/hooks/safes/useAllSafes'
import * as addressSimilarity from '../services/addressSimilarity'

jest.mock('@/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}))

jest.mock('@/hooks/safes/useAllSafes', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('../services/addressSimilarity', () => ({
  detectSimilarAddresses: jest.fn(),
}))

describe('useSafeSelectionModal', () => {
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
    ;(addressSimilarity.detectSimilarAddresses as jest.Mock).mockReturnValue({
      groups: [],
      addressToGroups: new Map(),
      isFlagged: () => false,
      getGroup: () => undefined,
    })
  })

  it('should initialize with modal closed', () => {
    const { result } = renderHook(() => useSafeSelectionModal())

    expect(result.current.isOpen).toBe(false)
    expect(result.current.selectedAddresses.size).toBe(0)
  })

  it('should open modal', () => {
    const { result } = renderHook(() => useSafeSelectionModal())

    act(() => {
      result.current.open()
    })

    expect(result.current.isOpen).toBe(true)
  })

  it('should close modal', () => {
    const { result } = renderHook(() => useSafeSelectionModal())

    act(() => {
      result.current.open()
    })

    act(() => {
      result.current.close()
    })

    expect(result.current.isOpen).toBe(false)
  })

  it('should toggle selection', () => {
    const { result } = renderHook(() => useSafeSelectionModal())

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

    const { result } = renderHook(() => useSafeSelectionModal())

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

    const { result } = renderHook(() => useSafeSelectionModal())

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
    const { result } = renderHook(() => useSafeSelectionModal())

    act(() => {
      result.current.setSearchQuery('Safe 1')
    })

    expect(result.current.availableItems.length).toBe(1)
    expect(result.current.availableItems[0].name).toBe('Safe 1')
  })

  it('should dispatch actions on submit', () => {
    const { result } = renderHook(() => useSafeSelectionModal())

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

    const { result } = renderHook(() => useSafeSelectionModal())

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

    const { result } = renderHook(() => useSafeSelectionModal())

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

    const { result } = renderHook(() => useSafeSelectionModal())

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
    const { result } = renderHook(() => useSafeSelectionModal())

    act(() => {
      result.current.selectAll()
    })

    expect(result.current.selectedAddresses.size).toBe(mockSafes.length)
    expect(result.current.selectedAddresses.has(mockSafes[0].address.toLowerCase())).toBe(true)
    expect(result.current.selectedAddresses.has(mockSafes[1].address.toLowerCase())).toBe(true)
  })

  it('should show confirmation when selecting all with similar addresses', () => {
    // Mock similar address detection
    ;(addressSimilarity.detectSimilarAddresses as jest.Mock).mockReturnValue({
      groups: [],
      addressToGroups: new Map(),
      isFlagged: (addr: string) => addr === mockSafes[0].address,
      getGroup: () => ({ bucketKey: 'test', addresses: [], hasKnownAddress: true, riskLevel: 'high' }),
    })

    const { result } = renderHook(() => useSafeSelectionModal())

    act(() => {
      result.current.selectAll()
    })

    // Should show confirmation dialog
    expect(result.current.pendingSelectAllConfirmation).toBe(true)
    // Should have only selected non-similar addresses
    expect(result.current.selectedAddresses.has(mockSafes[0].address.toLowerCase())).toBe(false)
    expect(result.current.selectedAddresses.has(mockSafes[1].address.toLowerCase())).toBe(true)
  })

  it('should select all including similar when confirmed', () => {
    ;(addressSimilarity.detectSimilarAddresses as jest.Mock).mockReturnValue({
      groups: [],
      addressToGroups: new Map(),
      isFlagged: (addr: string) => addr === mockSafes[0].address,
      getGroup: () => ({ bucketKey: 'test', addresses: [], hasKnownAddress: true, riskLevel: 'high' }),
    })

    const { result } = renderHook(() => useSafeSelectionModal())

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

  it('should keep only non-similar when select all cancelled', () => {
    ;(addressSimilarity.detectSimilarAddresses as jest.Mock).mockReturnValue({
      groups: [],
      addressToGroups: new Map(),
      isFlagged: (addr: string) => addr === mockSafes[0].address,
      getGroup: () => ({ bucketKey: 'test', addresses: [], hasKnownAddress: true, riskLevel: 'high' }),
    })

    const { result } = renderHook(() => useSafeSelectionModal())

    act(() => {
      result.current.selectAll()
    })

    act(() => {
      result.current.cancelSelectAll()
    })

    expect(result.current.pendingSelectAllConfirmation).toBe(false)
    // Non-similar should remain selected
    expect(result.current.selectedAddresses.has(mockSafes[1].address.toLowerCase())).toBe(true)
    // Similar should not be selected
    expect(result.current.selectedAddresses.has(mockSafes[0].address.toLowerCase())).toBe(false)
  })

  it('should deselect all safes', () => {
    const { result } = renderHook(() => useSafeSelectionModal())

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
})
