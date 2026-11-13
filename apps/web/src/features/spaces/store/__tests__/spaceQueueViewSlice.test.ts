import { makeStore, type RootState } from '@/store'
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

  it('keeps the picked grouping in localStorage', () => {
    const store = makeStore()

    store.dispatch(setQueueGroupBy('network'))

    expect(selectQueueGroupBy(store.getState())).toBe('network')
    expect(local.getItem(spaceQueueViewSlice.name)).toEqual({ groupBy: 'network' })
  })

  it('restores the saved grouping when the app loads', () => {
    const store = makeStore()

    store.dispatch({ type: HYDRATE_ACTION, payload: { [spaceQueueViewSlice.name]: { groupBy: 'next' } } })

    expect(selectQueueGroupBy(store.getState())).toBe('next')
  })

  it('lists by status when the saved grouping is one the menu no longer offers', () => {
    const store = makeStore()

    store.dispatch({ type: HYDRATE_ACTION, payload: { [spaceQueueViewSlice.name]: { groupBy: 'priority' } } })

    expect(selectQueueGroupBy(store.getState())).toBe('status')
  })

  it('lists by status when nothing was saved for the queue', () => {
    expect(selectQueueGroupBy({} as RootState)).toBe('status')
  })
})
