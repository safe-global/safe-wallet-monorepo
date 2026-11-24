import { getPersistedState, makeStore } from '@/store'
import { HYDRATE_ACTION } from '@/store/hydrateAction'
import local from '@/services/local-storage/local'
import { selectQueueGroupBy, setQueueGroupBy, spaceQueueViewSlice } from '../spaceQueueViewSlice'

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

  it('saves only the grouping, not the queue filters', () => {
    makeStore().dispatch(setQueueGroupBy('network'))

    expect(local.getItem(spaceQueueViewSlice.name)).toStrictEqual({ groupBy: 'network' })
  })

  it('falls back to status when the saved grouping is no longer an option', () => {
    local.setItem(spaceQueueViewSlice.name, { groupBy: 'removed-option' })

    expect(selectQueueGroupBy(reload().getState())).toBe('status')
  })

  it('falls back to status when the saved value is not a grouping object', () => {
    local.setItem(spaceQueueViewSlice.name, 'network')

    expect(selectQueueGroupBy(reload().getState())).toBe('status')
  })
})
