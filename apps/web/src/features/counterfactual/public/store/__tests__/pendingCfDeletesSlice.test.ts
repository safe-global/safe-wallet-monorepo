import {
  pendingCfDeletesSlice,
  enqueuePendingCfDelete,
  removePendingCfDelete,
  clearPendingCfDeletes,
} from '../pendingCfDeletesSlice'

const reduce = (state: ReturnType<typeof pendingCfDeletesSlice.reducer>, action: { type: string; payload?: unknown }) =>
  pendingCfDeletesSlice.reducer(state, action as Parameters<typeof pendingCfDeletesSlice.reducer>[1])

describe('pendingCfDeletesSlice', () => {
  it('returns an empty queue by default', () => {
    expect(pendingCfDeletesSlice.reducer(undefined, { type: '@@INIT' })).toEqual([])
  })

  it('enqueues a new delete', () => {
    const next = reduce([], enqueuePendingCfDelete({ chainId: '1', address: '0xabc' }))
    expect(next).toEqual([{ chainId: '1', address: '0xabc' }])
  })

  it('does not enqueue duplicates with the same chainId+address', () => {
    let state = reduce([], enqueuePendingCfDelete({ chainId: '1', address: '0xabc' }))
    state = reduce(state, enqueuePendingCfDelete({ chainId: '1', address: '0xabc' }))
    expect(state).toEqual([{ chainId: '1', address: '0xabc' }])
  })

  it('treats different chains as distinct entries', () => {
    let state = reduce([], enqueuePendingCfDelete({ chainId: '1', address: '0xabc' }))
    state = reduce(state, enqueuePendingCfDelete({ chainId: '11155111', address: '0xabc' }))
    expect(state).toHaveLength(2)
  })

  it('removes a single entry without affecting the rest', () => {
    let state = reduce([], enqueuePendingCfDelete({ chainId: '1', address: '0xabc' }))
    state = reduce(state, enqueuePendingCfDelete({ chainId: '1', address: '0xdef' }))

    state = reduce(state, removePendingCfDelete({ chainId: '1', address: '0xabc' }))
    expect(state).toEqual([{ chainId: '1', address: '0xdef' }])
  })

  it('removing a non-existent entry is a no-op', () => {
    const initial = [{ chainId: '1', address: '0xabc' }]
    const state = reduce(initial, removePendingCfDelete({ chainId: '1', address: '0xnope' }))
    expect(state).toEqual(initial)
  })

  it('clears the entire queue', () => {
    let state = reduce([], enqueuePendingCfDelete({ chainId: '1', address: '0xabc' }))
    state = reduce(state, enqueuePendingCfDelete({ chainId: '1', address: '0xdef' }))

    state = reduce(state, clearPendingCfDeletes())
    expect(state).toEqual([])
  })
})
