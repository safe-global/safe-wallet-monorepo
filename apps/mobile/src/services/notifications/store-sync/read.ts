import { STORAGE_IDS } from '@/src/store/constants'
import { extensionStorage } from './const'

interface ExtensionStore {
  chains: Record<string, { name: string; symbol: string; decimals: number }>
  contacts: Record<string, string>
}

/**
 * Read extension data from MMKV storage
 * This function is separate from extensionSync.ts to avoid require cycles
 * It only reads data and has no dependencies on the Redux store
 */
export function getExtensionData(): ExtensionStore | null {
  try {
    const data = extensionStorage.getString(STORAGE_IDS.NOTIFICATION_EXTENSION_DATA)
    if (!data) {
      return null
    }
    return JSON.parse(data) as ExtensionStore
  } catch (error) {
    console.error('extensionDataReader: Failed to get extension data', error)
    return null
  }
}
