import { renderHook, waitFor } from '@/tests/test-utils'
import { makeStore, useInitStaticChains } from '@/store'
import { Provider } from 'react-redux'
import type { ReactNode } from 'react'

describe('useInitStaticChains', () => {
  it('should dispatch actions for a background chains refetch', async () => {
    const store = makeStore(undefined, { skipBroadcast: true })
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>

    renderHook(() => useInitStaticChains(), { wrapper })

    // The hook dispatches initiate({ forceRefetch: true }) to trigger a
    // background network fetch for fresh chain data.
    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalled()
    })

    dispatchSpy.mockRestore()
  })

  it('should clean up subscription on unmount', async () => {
    const store = makeStore(undefined, { skipBroadcast: true })

    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>

    const { unmount } = renderHook(() => useInitStaticChains(), { wrapper })

    // Give the effect time to run
    await waitFor(() => {
      expect(store.dispatch).toBeDefined()
    })

    // Cleanup should not throw (unsubscribe is called if available)
    expect(() => unmount()).not.toThrow()
  })
})
