import type { Middleware } from '@reduxjs/toolkit'
import isPlainObject from 'lodash/isPlainObject'

import local from '@/services/local-storage/local'
import type { RootState } from '@/store'

// Hydration merges the stored value into the initial state; a value of another kind (a primitive,
// or an array for an object slice) replaces the slice and crashes the app on every load.
// ponytail: top-level kind only; wrong nested shapes still need a per-slice migration.
const isSameKind = (value: unknown, initial: unknown): boolean =>
  Array.isArray(initial) ? Array.isArray(value) : isPlainObject(value)

export const getPreloadedState = <K extends keyof RootState>(
  sliceNames: K[],
  initialState: Pick<RootState, K>,
): Partial<RootState> => {
  return sliceNames.reduce<Partial<RootState>>((preloadedState, sliceName) => {
    const sliceState = local.getItem<RootState[K]>(sliceName as string)

    if (sliceState && isSameKind(sliceState, initialState[sliceName])) {
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
      if ('_isBroadcasted' in action && action._isBroadcasted) return result

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
