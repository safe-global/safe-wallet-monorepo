import { renderHook } from '@/tests/test-utils'
import useKeyboardObserver from '../useKeyboardObserver'
import * as globalSearchSlice from '@/features/global-search/store'

describe('useKeyboardObserver', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('dispatches toggleGlobalSearch on Cmd+K', () => {
    const spy = jest.spyOn(globalSearchSlice, 'toggleGlobalSearch')

    renderHook(() => useKeyboardObserver())

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))

    expect(spy).toHaveBeenCalled()
  })

  it('dispatches toggleGlobalSearch on Ctrl+K', () => {
    const spy = jest.spyOn(globalSearchSlice, 'toggleGlobalSearch')

    renderHook(() => useKeyboardObserver())

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))

    expect(spy).toHaveBeenCalled()
  })

  it('does not dispatch on K without modifier', () => {
    const spy = jest.spyOn(globalSearchSlice, 'toggleGlobalSearch')

    renderHook(() => useKeyboardObserver())

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }))

    expect(spy).not.toHaveBeenCalled()
  })
})
