import type { Middleware } from '@reduxjs/toolkit'

import local from '@/services/local-storage/local'
import type { RootState } from '@/store'

export const getPreloadedState = <K extends keyof RootState>(sliceNames: K[]): Partial<RootState> => {
  return sliceNames.reduce<Partial<RootState>>((preloadedState, sliceName) => {
    const sliceState = local.getItem<RootState[K]>(sliceName as string)

    if (sliceState) {
      preloadedState[sliceName] = sliceState
    }

    return preloadedState
  }, {})
}

export const persistState = <K extends keyof RootState>(sliceNames: K[]): Middleware<{}, RootState> => {
  return (store) => (next) => (action) => {
    const result = next(action)

    if (typeof action === 'object' && action !== null && 'type' in action) {
      // No need to persist broadcasted actions because they are persisted in another tab
      if ('_isBroadcasted' in action && action._isBroadcasted) {
        return result
      }

      const sliceType = (action as { type: string }).type.split('/')[0]
      const name = sliceNames.find((slice) => slice === sliceType)

      if (name) {
        const state = store.getState()
        const sliceState = state[name]

        if (sliceState) {
          local.setItem(name as string, sliceState)
        } else {
          local.removeItem(name as string)
        }
      }
    }

    return result
  }
}
