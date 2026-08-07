import { createMMKV } from 'react-native-mmkv'
import { safeJsonParse, safeJsonStringify } from '@walletconnect/safe-json'

export interface WcStorageAdapter {
  getKeys: () => Promise<string[]>
  getEntries: <T = unknown>() => Promise<[string, T][]>
  getItem: <T = unknown>(key: string) => Promise<T | undefined>
  setItem: <T = unknown>(key: string, value: T) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

export function createMmkvStorage(id: string): WcStorageAdapter {
  const mmkv = createMMKV({ id })

  return {
    getKeys: async () => mmkv.getAllKeys(),
    getEntries: async <T = unknown>(): Promise<[string, T][]> => {
      const keys = mmkv.getAllKeys()
      return keys.map((key): [string, T] => {
        const value = mmkv.getString(key)
        return [key, safeJsonParse(value ?? '') as T]
      })
    },
    getItem: async <T = unknown>(key: string): Promise<T | undefined> => {
      const item = mmkv.getString(key)
      if (typeof item === 'undefined' || item === null) {
        return undefined
      }
      return safeJsonParse(item) as T
    },
    setItem: async <T = unknown>(key: string, value: T) => {
      mmkv.set(key, safeJsonStringify(value))
    },
    removeItem: async (key: string) => {
      await mmkv.remove(key)
    },
  }
}
