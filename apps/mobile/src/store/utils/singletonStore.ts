import { RootState, AppDispatch } from '@/src/store'

type StoreLike = { dispatch: AppDispatch; getState: () => RootState }
let store: StoreLike | undefined

export const setBackendStore = (newStore: StoreLike): void => {
  store = newStore
}

export const getStore = () => {
  if (!store) {
    throw new Error('Backend notification store not initialized')
  }
  return store
}
