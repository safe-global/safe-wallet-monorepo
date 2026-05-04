import ExternalStore from '@safe-global/utils/services/ExternalStore'
import type { PasskeyMetadata, PasskeyStorage } from '@safe-global/utils/services/passkey'
import { localItem } from '@/services/local-storage/local'

const STORAGE_KEY = 'passkeyMetadata'
const passkeyStorageBackend = localItem<PasskeyMetadata[]>(STORAGE_KEY)

function readCollection(): PasskeyMetadata[] {
  const stored = passkeyStorageBackend.get()
  return Array.isArray(stored) ? stored : []
}

function writeCollection(collection: PasskeyMetadata[]): void {
  passkeyStorageBackend.set(collection)
}

export const webPasskeyStorage: PasskeyStorage = {
  async getAll() {
    return readCollection()
  },
  async getByRawId(rawId) {
    return readCollection().find((entry) => entry.rawId === rawId) ?? null
  },
  async add(metadata) {
    const collection = readCollection()
    const idx = collection.findIndex((entry) => entry.rawId === metadata.rawId)
    if (idx >= 0) {
      collection[idx] = metadata
    } else {
      collection.push(metadata)
    }
    writeCollection(collection)
  },
  async removeByRawId(rawId) {
    writeCollection(readCollection().filter((entry) => entry.rawId !== rawId))
  },
  async markDeployedOnChain(rawId, chainId) {
    const collection = readCollection()
    const entry = collection.find((e) => e.rawId === rawId)
    if (!entry) {
      throw new Error('No passkey metadata found for rawId')
    }
    if (!entry.deployedOnChains.includes(chainId)) {
      entry.deployedOnChains = [...entry.deployedOnChains, chainId]
      writeCollection(collection)
    }
  },
  async setIdentityForChain(rawId, chainId, address) {
    const collection = readCollection()
    const entry = collection.find((e) => e.rawId === rawId)
    if (!entry) {
      throw new Error('No passkey metadata found for rawId')
    }
    if (entry.identityContractAddresses[chainId] !== address) {
      entry.identityContractAddresses = { ...entry.identityContractAddresses, [chainId]: address }
      writeCollection(collection)
    }
  },
}

/**
 * Popup state used by the manual-import dialog (until the CGW coord-storage
 * API ships, web users have no automatic discovery path — they paste the
 * rawId + coordinates from the mobile app).
 */
export type PasskeyPopupStore = {
  isOpen: boolean
  data: PasskeyMetadata | null
}

const popupStore = new ExternalStore<PasskeyPopupStore>({ isOpen: false, data: null })

export default popupStore

export function getActivePasskey(): PasskeyMetadata | null {
  return readCollection()[0] ?? null
}
