import { useEffect } from 'react'
import { getPersistedState, type makeStore } from '@/store'
import { HYDRATE_ACTION } from './hydrateAction'

export const useHydrateStore = (store: ReturnType<typeof makeStore>) => {
  useEffect(() => {
    store.dispatch({
      type: HYDRATE_ACTION,
      payload: getPersistedState(),
    })
  }, [store])
}
