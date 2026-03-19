/* eslint-disable @typescript-eslint/no-extraneous-class */
import { Storage } from 'redux-persist'
import { createMMKV } from 'react-native-mmkv'
import { mapStorageTypeToIds, STORAGE_IDS, STORAGE_TYPES } from './constants'

const safeStorage = createMMKV({
  id: STORAGE_IDS.SAFE,
})

export const reduxStorage: Storage = {
  setItem: (key, value) => {
    safeStorage.set(key, value)
    return Promise.resolve(true)
  },
  getItem: (key) => {
    const value = safeStorage.getString(key)
    return Promise.resolve(value)
  },
  removeItem: (key) => {
    safeStorage.remove(key)
    return Promise.resolve()
  },
}

export class safeMMKVStorage {
  static getLocal(key: STORAGE_IDS) {
    if (!key) {
      return
    }

    const keyType = mapStorageTypeToIds(key)

    switch (keyType) {
      case STORAGE_TYPES.STRING:
        return safeStorage.getString(key)
      case STORAGE_TYPES.NUMBER:
        return safeStorage.getNumber(key)
      case STORAGE_TYPES.BOOLEAN:
        return safeStorage.getBoolean(key)
      case STORAGE_TYPES.OBJECT:
        return JSON.parse(safeStorage.getString(key) || '{}')
      default:
        return safeStorage.getString(key)
    }
  }

  static saveLocal(key: string, value: string | number | boolean | ArrayBuffer) {
    if (!key) {
      return
    }
    const valueType = typeof value

    if (valueType === 'object') {
      return safeStorage.set(key, JSON.stringify(value))
    }

    return safeStorage.set(key, value)
  }

  static clearAllStorages() {
    Object.keys(STORAGE_IDS).forEach((id) => {
      const storage = createMMKV({ id })
      storage.clearAll()
    })

    const defaultStorage = createMMKV()
    defaultStorage.clearAll()
  }
}
