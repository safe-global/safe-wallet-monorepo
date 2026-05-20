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

  // Minimal stub of base-ui's SelectRootChangeEventDetails — only what handleSafeChange reads.
  const itemPress = () => ({ reason: 'item-press', cancel: () => {} }) as any
  const noneReason = () => ({ reason: 'none', cancel: () => {} }) as any

  it('forwards user item-press picks to onItemSelect', () => {
    const onItemSelect = jest.fn()
    const { result } = renderHook(() =>
      useSafeSelectorState({
        items: [createItem('1:0xA'), createItem('2:0xB')],
        selectedItemId: '1:0xA',
        onItemSelect,
      }),
    )

    act(() => {
      result.current.handleSafeChange('2:0xB', itemPress())
    })

    expect(onItemSelect).toHaveBeenCalledTimes(1)
    expect(onItemSelect).toHaveBeenCalledWith('2:0xB')
  })

  /**
   * base-ui's Select calls onValueChange with reason='none' when its registered SelectItem set
   * changes and the controlled value no longer matches — e.g. expanding/collapsing a multi-chain
   * row, where the row's per-chain SelectItems mount/unmount. Forwarding these would navigate
   * back to base-ui's captured initial value (the safe selected on first mount).
   */
  it('ignores onValueChange when reason is not item-press (base-ui auto-reset)', () => {
    const onItemSelect = jest.fn()
    const { result } = renderHook(() =>
      useSafeSelectorState({
        items: [createItem('1:0xA'), createItem('2:0xB')],
        selectedItemId: '2:0xB',
        onItemSelect,
      }),
    )

    act(() => {
      result.current.handleSafeChange('1:0xA', noneReason())
    })

    expect(onItemSelect).not.toHaveBeenCalled()
  })

  it('ignores handleSafeChange when the picked value matches the current selection', () => {
    const onItemSelect = jest.fn()
    const { result } = renderHook(() =>
      useSafeSelectorState({
        items: [createItem('1:0xA'), createItem('2:0xB')],
        selectedItemId: '1:0xA',
        onItemSelect,
      }),
    )

    act(() => {
      result.current.handleSafeChange('1:0xA', itemPress())
    })

    expect(onItemSelect).not.toHaveBeenCalled()
  })

  // base-ui's setValue (SelectRoot.js) honors `eventDetails.isCanceled` and skips its internal
  // setValueUnwrapped when canceled. Without cancel(), base-ui briefly overwrites
  // its own state with `initialValueRef.current` before our props re-stabilise.
  it.each([
    ['none', 'auto-reset when registered SelectItems change'],
    ['cancel-open', 'open canceled by user / library'],
    ['list-navigation', 'keyboard arrow navigation'],
    ['outside-press', 'click outside the popup'],
  ])('calls eventDetails.cancel() and skips onItemSelect for reason=%s (%s)', (reason) => {
    const onItemSelect = jest.fn()
    const cancel = jest.fn()
    const { result } = renderHook(() =>
      useSafeSelectorState({
        items: [createItem('1:0xA'), createItem('2:0xB')],
        selectedItemId: '2:0xB',
        onItemSelect,
      }),
    )

    act(() => {
      result.current.handleSafeChange('1:0xA', { reason, cancel } as any)
    })

    expect(cancel).toHaveBeenCalledTimes(1)
    expect(onItemSelect).not.toHaveBeenCalled()
  })

  it('coerces null value to empty string and skips onItemSelect when current selection is also empty', () => {
    const onItemSelect = jest.fn()
    const { result } = renderHook(() =>
      useSafeSelectorState({
        items: [createItem('1:0xA'), createItem('2:0xB')],
        selectedItemId: '',
        onItemSelect,
      }),
    )

    act(() => {
      result.current.handleSafeChange(null, itemPress())
    })

    expect(onItemSelect).not.toHaveBeenCalled()
  })

  it('forwards null as empty string to onItemSelect when current selection is non-empty', () => {
    const onItemSelect = jest.fn()
    const { result } = renderHook(() =>
      useSafeSelectorState({
        items: [createItem('1:0xA'), createItem('2:0xB')],
        selectedItemId: '1:0xA',
        onItemSelect,
      }),
    )

    act(() => {
      result.current.handleSafeChange(null, itemPress())
    })

    expect(onItemSelect).toHaveBeenCalledTimes(1)
    expect(onItemSelect).toHaveBeenCalledWith('')
  })
})
