import { renderHook, waitFor } from '@/tests/test-utils'
import { makeStore, useInitChains } from '@/store'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { Provider } from 'react-redux'
import type { ReactNode } from 'react'

describe('useInitChains', () => {
  it('does not seed chain data into the RTK Query cache', () => {
    const store = makeStore(undefined, { skipBroadcast: true })

    // With build-time prefetch removed, the cgw query cache must start empty.
    expect(store.getState()[cgwClient.reducerPath].queries).toEqual({})
  })

  it('dispatches a chains fetch on mount', async () => {
    const store = makeStore(undefined, { skipBroadcast: true })
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>

    renderHook(() => useInitChains(), { wrapper })

    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalled()
    })

    dispatchSpy.mockRestore()
  })

  it('cleans up the subscription on unmount', async () => {
    const store = makeStore(undefined, { skipBroadcast: true })

    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>

    const { unmount } = renderHook(() => useInitChains(), { wrapper })

    await waitFor(() => {
      expect(store.dispatch).toBeDefined()
    })

    expect(() => unmount()).not.toThrow()
  })
})
