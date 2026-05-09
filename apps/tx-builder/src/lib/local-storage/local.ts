import Storage from './Storage'

const local = new Storage(typeof window !== 'undefined' ? window.localStorage : undefined)

export const localItem = <T>(key: string) => ({
  get: () => local.getItem<T>(key),
  set: (value: T) => local.setItem<T>(key, value),
  remove: () => local.removeItem(key),
})

export default local
