import { makeStore, setStoreInstance } from '@/store'

let store: ReturnType<typeof makeStore> | undefined

export function getAppStore() {
  if (!store) {
    store = makeStore()
    setStoreInstance(store)
  }
  return store
}
