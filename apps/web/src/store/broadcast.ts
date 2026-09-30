import type { Store } from 'redux'
import type { Middleware } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

const BC_NAME = 'SAFE__store-updates'
const tabId = Math.random().toString(32).slice(2)
let broadcast: BroadcastChannel | undefined

export const broadcastState = <K extends keyof RootState>(sliceNames: K[]): Middleware<{}, RootState> => {
  return () => (next) => (action: unknown) => {
    const result = next(action)

    // Broadcast actions that aren't being already broadcasted
    if (typeof action === 'object' && action !== null) {
      const actionObj = action as { _isBroadcasted?: boolean; type?: string }
      if (!actionObj._isBroadcasted && actionObj.type) {
        const sliceType = actionObj.type.split('/')[0]
        if (sliceNames.includes(sliceType as K)) {
          broadcast?.postMessage({ action, tabId })
        }
      }
    }

    return result
  }
}

export const listenToBroadcast = (store: Store<RootState>) => {
  broadcast?.close()
  broadcast = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(BC_NAME) : undefined

  broadcast?.addEventListener('message', ({ data }) => {
    if (data.tabId !== tabId) {
      store.dispatch({ ...data.action, _isBroadcasted: true })
    }
  })
}
