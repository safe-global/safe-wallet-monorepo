import { createE2eStore } from '../createE2eStore'

type Shape = { a: number; b: string }

describe('createE2eStore', () => {
  const make = () => createE2eStore<Shape>('test', { a: 0, b: 'x' })

  it('returns the initial state from get()', () => {
    expect(make().get()).toEqual({ a: 0, b: 'x' })
  })

  it('merges partial updates via set()', () => {
    const store = make()
    store.set({ a: 1 })
    expect(store.get()).toEqual({ a: 1, b: 'x' })
    store.set({ b: 'y' })
    expect(store.get()).toEqual({ a: 1, b: 'y' })
  })

  it('reset() restores the initial state', () => {
    const store = make()
    store.set({ a: 9, b: 'z' })
    store.reset()
    expect(store.get()).toEqual({ a: 0, b: 'x' })
  })

  it('reset() restores nested values even after in-place mutation of get()', () => {
    const store = createE2eStore('nested', { items: [] as number[], obj: { n: 0 } })
    store.get().items.push(1, 2)
    store.get().obj.n = 5
    store.reset()
    expect(store.get()).toEqual({ items: [], obj: { n: 0 } })
  })

  it('notifies subscribers on set/reset and stops after unsubscribe', () => {
    const store = make()
    const listener = jest.fn()
    const unsubscribe = store.subscribe(listener)

    store.set({ a: 1 })
    store.reset()
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    store.set({ a: 2 })
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('isolates state between separate stores', () => {
    const s1 = make()
    const s2 = make()
    s1.set({ a: 100 })
    expect(s2.get().a).toBe(0)
  })

  it('swallows listener errors so one bad subscriber cannot break notification', () => {
    const store = make()
    const good = jest.fn()
    store.subscribe(() => {
      throw new Error('boom')
    })
    store.subscribe(good)
    expect(() => store.set({ a: 1 })).not.toThrow()
    expect(good).toHaveBeenCalledTimes(1)
  })
})
