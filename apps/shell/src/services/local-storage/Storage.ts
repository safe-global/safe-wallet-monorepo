import { asError } from '@safe-global/utils/services/exceptions/utils'
import { reviver, replacer } from './storageHelpers'

type BrowserStorage = typeof localStorage | typeof sessionStorage

const LS_NAMESPACE = 'SAFE_v2__'

type ItemWithExpiry<T> = {
  value: T
  expiry: number
}

class Storage {
  private readonly prefix: string
  private storage?: BrowserStorage

  constructor(storage?: BrowserStorage, prefix = LS_NAMESPACE) {
    this.prefix = prefix
    this.storage = storage
  }

  public getPrefixedKey = (key: string): string => {
    return `${this.prefix}${key}`
  }

  public getItem = <T>(key: string): T | null => {
    const fullKey = this.getPrefixedKey(key)
    let saved: string | null = null
    try {
      saved = this.storage?.getItem(fullKey) ?? null
    } catch (err) {
      console.error(`Storage error getting key ${key}:`, asError(err).message)
    }

    if (saved == null) return null

    try {
      return JSON.parse(saved, reviver) as T
    } catch (err) {
      console.error(`Storage error parsing key ${key}:`, asError(err).message)
    }
    return null
  }

  public setItem = <T>(key: string, item: T): void => {
    const fullKey = this.getPrefixedKey(key)

    try {
      if (item == null) {
        this.storage?.removeItem(fullKey)
      } else {
        this.storage?.setItem(fullKey, JSON.stringify(item, replacer))
      }
    } catch (err) {
      console.error(`Storage error setting key ${key}:`, asError(err).message)
    }
  }

  public removeItem = (key: string): void => {
    const fullKey = this.getPrefixedKey(key)
    try {
      this.storage?.removeItem(fullKey)
    } catch (err) {
      console.error(`Storage error removing key ${key}:`, asError(err).message)
    }
  }

  public removeMatching = (pattern: RegExp): void => {
    Object.keys(this.storage || {})
      .filter((key) => pattern.test(key))
      .forEach((key) => this.storage?.removeItem(key))
  }

  public setWithExpiry = <T>(key: string, item: T, expiry: number): void => {
    this.setItem<ItemWithExpiry<T>>(key, {
      value: item,
      expiry: new Date().getTime() + expiry,
    })
  }

  public getWithExpiry = <T>(key: string): T | undefined => {
    const item = this.getItem<ItemWithExpiry<T>>(key)
    if (!item) {
      return
    }

    if (new Date().getTime() > item.expiry) {
      this.removeItem(key)
      return
    }

    return item.value
  }
}

export default Storage
