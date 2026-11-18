import {
  globalSearchSlice,
  openGlobalSearch,
  closeGlobalSearch,
  toggleGlobalSearch,
  selectGlobalSearchOpen,
} from '../globalSearchSlice'

const reducer = globalSearchSlice.reducer

describe('globalSearchSlice', () => {
  it('has initial state with open: false', () => {
    const state = reducer(undefined, { type: 'unknown' })
    expect(state).toEqual({ open: false })
  })

  it('openGlobalSearch sets open to true', () => {
    const state = reducer({ open: false }, openGlobalSearch())
    expect(state.open).toBe(true)
  })

  it('closeGlobalSearch sets open to false', () => {
    const state = reducer({ open: true }, closeGlobalSearch())
    expect(state.open).toBe(false)
  })

  it('toggleGlobalSearch flips the value from false to true', () => {
    const state = reducer({ open: false }, toggleGlobalSearch())
    expect(state.open).toBe(true)
  })

  it('toggleGlobalSearch flips the value from true to false', () => {
    const state = reducer({ open: true }, toggleGlobalSearch())
    expect(state.open).toBe(false)
  })

  it('selectGlobalSearchOpen returns the open value', () => {
    const rootState = { [globalSearchSlice.name]: { open: true } }
    expect(selectGlobalSearchOpen(rootState as never)).toBe(true)

    const closedState = { [globalSearchSlice.name]: { open: false } }
    expect(selectGlobalSearchOpen(closedState as never)).toBe(false)
  })
})
