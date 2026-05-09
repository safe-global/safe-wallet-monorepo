const LS_NAMESPACE = 'TX_BUILDER__'

type BrowserStorage = typeof localStorage | typeof sessionStorage

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
      console.error(`key ${key} – ${(err as Error).message}`)
    }

    if (saved == null) return null

    try {
      return JSON.parse(saved) as T
    } catch (err) {
      console.error(`key ${key} – ${(err as Error).message}`)
    }
    return null
  }

  public setItem = <T>(key: string, item: T): void => {
    const fullKey = this.getPrefixedKey(key)
    try {
      if (item == null) {
        this.storage?.removeItem(fullKey)
      } else {
        this.storage?.setItem(fullKey, JSON.stringify(item))
      }
    } catch (err) {
      console.error(`key ${key} – ${(err as Error).message}`)
    }
  }

  public removeItem = (key: string): void => {
    const fullKey = this.getPrefixedKey(key)
    try {
      this.storage?.removeItem(fullKey)
    } catch (err) {
      console.error(`key ${key} – ${(err as Error).message}`)
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
