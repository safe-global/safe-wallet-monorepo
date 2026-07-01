import toastReducer, { showToast, dismissToast, type Toast } from './toastSlice'

describe('toastSlice', () => {
  it('appends a toast with a generated id', () => {
    const state = toastReducer(undefined, showToast({ message: 'Hello' }))

    expect(state.queue).toHaveLength(1)
    expect(state.queue[0]).toMatchObject({ message: 'Hello' })
    expect(state.queue[0].id).toEqual(expect.any(String))
  })

  it('carries optional duration and variant through', () => {
    const state = toastReducer(undefined, showToast({ message: 'Boom', duration: 3000, variant: 'error' }))

    expect(state.queue[0]).toMatchObject({ message: 'Boom', duration: 3000, variant: 'error' })
  })

  it('queues multiple toasts with distinct ids', () => {
    let state = toastReducer(undefined, showToast({ message: 'first' }))
    state = toastReducer(state, showToast({ message: 'second' }))

    expect(state.queue).toHaveLength(2)
    expect(state.queue[0].id).not.toEqual(state.queue[1].id)
  })

  it('dismisses only the matching toast', () => {
    const existing: Toast[] = [
      { id: 'a', message: 'keep' },
      { id: 'b', message: 'drop' },
    ]
    const state = toastReducer({ queue: existing }, dismissToast('b'))

    expect(state.queue).toEqual([{ id: 'a', message: 'keep' }])
  })

  it('is a no-op when dismissing an unknown id', () => {
    const existing: Toast[] = [{ id: 'a', message: 'keep' }]
    const state = toastReducer({ queue: existing }, dismissToast('missing'))

    expect(state.queue).toEqual(existing)
  })
})
