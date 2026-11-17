import { getPersistedState, makeStore } from '@/store'
import { HYDRATE_ACTION } from '@/store/useHydrateStore'
import local from '@/services/local-storage/local'
import { selectQueueGroupBy, setQueueGroupBy, spaceQueueViewSlice } from '../spaceQueueViewSlice'

describe('spaceQueueViewSlice', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('lists the queue by status until the user picks a grouping', () => {
    const store = makeStore()

    expect(selectQueueGroupBy(store.getState())).toBe('status')
  })

  it('keeps the picked grouping for the session without saving it to localStorage', () => {
    const store = makeStore()

    store.dispatch(setQueueGroupBy('network'))

    expect(selectQueueGroupBy(store.getState())).toBe('network')
    expect(local.getItem(spaceQueueViewSlice.name)).toBeNull()
  })

  it('lists by status again after a reload', () => {
    makeStore().dispatch(setQueueGroupBy('next'))

    const reloaded = makeStore()
    reloaded.dispatch({ type: HYDRATE_ACTION, payload: getPersistedState() })

    expect(selectQueueGroupBy(reloaded.getState())).toBe('status')
  })
})
