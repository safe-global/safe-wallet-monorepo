import { renderHook, act } from '@testing-library/react'
import { useSafeSelectorState } from './useSafeSelectorState'
import type { SafeItemData } from '../types'

const createItem = (id: string): SafeItemData => ({
  id,
  name: `Safe ${id}`,
  address: `0x${id}`,
  threshold: 1,
  owners: 2,
  balance: '100',
  chains: [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }],
})

describe('useSafeSelectorState', () => {
  it('blocks opening the dropdown when there is only one safe', () => {
    const { result } = renderHook(() => useSafeSelectorState({ items: [createItem('1')], selectedItemId: '1' }))

    expect(result.current.isSingleSafe).toBe(true)

    act(() => result.current.handleOpenChange(true))
    expect(result.current.dropdownOpen).toBe(false)
  })

  it('allows opening the dropdown when there are multiple safes', () => {
    const { result } = renderHook(() =>
      useSafeSelectorState({ items: [createItem('1'), createItem('2')], selectedItemId: '1' }),
    )

    expect(result.current.isSingleSafe).toBe(false)

    act(() => result.current.handleOpenChange(true))
    expect(result.current.dropdownOpen).toBe(true)
  })

  // When the user has only one safe (e.g. a non-pinned safe loaded via URL),
  // the dropdown still needs to open so they can access "Trusted Safes >"
  // and "All accounts >" in the header/footer. Without forceOpenable, the
  // dropdown would stay locked and the user would have no way to manage
  // their trusted safes from the selector.
  it('allows opening the dropdown with a single safe when forceOpenable is true', () => {
    const { result } = renderHook(() =>
      useSafeSelectorState({ items: [createItem('1')], selectedItemId: '1', forceOpenable: true }),
    )

    expect(result.current.isSingleSafe).toBe(false)

    act(() => result.current.handleOpenChange(true))
    expect(result.current.dropdownOpen).toBe(true)
  })

  it('closes the dropdown via closeDropdown', () => {
    const { result } = renderHook(() =>
      useSafeSelectorState({ items: [createItem('1'), createItem('2')], selectedItemId: '1' }),
    )

    act(() => result.current.handleOpenChange(true))
    expect(result.current.dropdownOpen).toBe(true)

    act(() => result.current.closeDropdown())
    expect(result.current.dropdownOpen).toBe(false)
  })

  it('returns undefined selectedItem when selectedItemId does not match any item', () => {
    const { result } = renderHook(() =>
      useSafeSelectorState({ items: [createItem('1'), createItem('2')], selectedItemId: 'unknown' }),
    )

    expect(result.current.selectedItem).toBeUndefined()
  })

  it('returns undefined selectedItem when selectedItemId is empty', () => {
    const { result } = renderHook(() =>
      useSafeSelectorState({ items: [createItem('1'), createItem('2')], selectedItemId: '' }),
    )

    expect(result.current.selectedItem).toBeUndefined()
  })

  /**
   * When a controlled Select emits onValueChange twice (new id, then snap-back to the previous id
   * before the URL updates), only the first call is forwarded — the second matches currentSelectionId.
   */
  it('ignores handleSafeChange when the value matches the current selection (revert snap-back)', () => {
    const onItemSelect = jest.fn()
    const { result } = renderHook(() =>
      useSafeSelectorState({
        items: [createItem('1:0xA'), createItem('2:0xB')],
        selectedItemId: '1:0xA',
        onItemSelect,
      }),
    )

    act(() => {
      result.current.handleSafeChange('2:0xB')
      result.current.handleSafeChange('1:0xA')
    })

    expect(onItemSelect).toHaveBeenCalledTimes(1)
    expect(onItemSelect).toHaveBeenCalledWith('2:0xB')
  })
})
