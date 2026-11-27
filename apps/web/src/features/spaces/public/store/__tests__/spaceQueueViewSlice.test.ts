import { getPersistedState, makeStore } from '@/store'
import { HYDRATE_ACTION } from '@/store/hydrateAction'
import local from '@/services/local-storage/local'
import {
  migrateSpaceQueueView,
  selectQueueCollapseAll,
  selectQueueGroupBy,
  setQueueCollapseAll,
  setQueueGroupBy,
  spaceQueueViewSlice,
} from '../spaceQueueViewSlice'

const reload = () => {
  const store = makeStore()
  store.dispatch({ type: HYDRATE_ACTION, payload: getPersistedState() })
  return store
}

describe('spaceQueueViewSlice', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('lists the queue by status until the user picks a grouping', () => {
    const store = makeStore()

    expect(selectQueueGroupBy(store.getState())).toBe('status')
  })

  it('lists the queue by status on a first visit, with nothing saved', () => {
    expect(selectQueueGroupBy(reload().getState())).toBe('status')
  })

  it('keeps the picked grouping after a reload', () => {
    makeStore().dispatch(setQueueGroupBy('next'))

    expect(selectQueueGroupBy(reload().getState())).toBe('next')
  })

  it('saves only the grouping and the Collapse all pick, not the queue filters', () => {
    makeStore().dispatch(setQueueGroupBy('network'))

    expect(local.getItem(spaceQueueViewSlice.name)).toStrictEqual({ groupBy: 'network', collapseAll: false })
  })

  it('shows every group expanded until the user picks Collapse all', () => {
    expect(selectQueueCollapseAll(makeStore().getState())).toBe(false)
    expect(selectQueueCollapseAll(reload().getState())).toBe(false)
  })

  it('keeps Collapse all after a reload', () => {
    makeStore().dispatch(setQueueCollapseAll(true))

    expect(selectQueueCollapseAll(reload().getState())).toBe(true)
  })

  it('keeps Expand all after a reload', () => {
    const store = makeStore()
    store.dispatch(setQueueCollapseAll(true))
    store.dispatch(setQueueCollapseAll(false))

    expect(selectQueueCollapseAll(reload().getState())).toBe(false)
  })

  it('keeps Collapse all when only the saved grouping is no longer an option', () => {
    local.setItem(spaceQueueViewSlice.name, { groupBy: 'removed-option', collapseAll: true })

    const state = reload().getState()

    expect(selectQueueGroupBy(state)).toBe('status')
    expect(selectQueueCollapseAll(state)).toBe(true)
  })

  it('keeps the grouping when only the saved Collapse all pick is not valid', () => {
    local.setItem(spaceQueueViewSlice.name, { groupBy: 'network', collapseAll: 'yes' })

    const state = reload().getState()

    expect(selectQueueGroupBy(state)).toBe('network')
    expect(selectQueueCollapseAll(state)).toBe(false)
  })

  it('expands every group when a grouping was saved before Collapse all was', () => {
    local.setItem(spaceQueueViewSlice.name, { groupBy: 'safe' })

    const state = reload().getState()

    expect(selectQueueGroupBy(state)).toBe('safe')
    expect(selectQueueCollapseAll(state)).toBe(false)
  })

  it('falls back to status when the saved grouping is no longer an option', () => {
    local.setItem(spaceQueueViewSlice.name, { groupBy: 'removed-option' })

    expect(selectQueueGroupBy(reload().getState())).toBe('status')
  })

  it('falls back to status when the saved value is not a grouping object', () => {
    local.setItem(spaceQueueViewSlice.name, 'network')

    expect(selectQueueGroupBy(reload().getState())).toBe('status')
  })

  describe('migrateSpaceQueueView', () => {
    it.each([null, undefined, 'network', 42, []])('falls back to the defaults for %p', (saved) => {
      expect(migrateSpaceQueueView(saved)).toStrictEqual({ groupBy: 'status', collapseAll: false })
    })

    it('checks each field on its own', () => {
      expect(migrateSpaceQueueView({ groupBy: 'next', collapseAll: 1 })).toStrictEqual({
        groupBy: 'next',
        collapseAll: false,
      })
      expect(migrateSpaceQueueView({ groupBy: 7, collapseAll: true })).toStrictEqual({
        groupBy: 'status',
        collapseAll: true,
      })
    })
  })
})
