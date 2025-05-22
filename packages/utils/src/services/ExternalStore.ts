import { useSyncExternalStore } from 'react'

type Listener = () => void
type Undefinable<T> = T | undefined

// Singleton with getter/setter whose hook triggers a re-render
class ExternalStore<T extends unknown> {
  private store: T | undefined
  private listeners: Set<Listener> = new Set()

  constructor(initialValue?: T) {
    this.store = initialValue
  }

  public readonly getStore = () => {
    return this.store
  }

  public readonly setStore = (value: Undefinable<T> | ((oldVal: Undefinable<T>) => Undefinable<T>)): void => {
    if (value !== this.store) {
      this.store = value instanceof Function ? value(this.store) : value
      this.listeners.forEach((listener) => listener())
    }
  }

  public readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  public readonly useStore = () => {
    return useSyncExternalStore(this.subscribe, this.getStore, this.getStore)
  }
}

export default ExternalStore
