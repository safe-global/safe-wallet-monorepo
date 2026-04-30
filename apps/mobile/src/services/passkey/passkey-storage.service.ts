import * as Keychain from 'react-native-keychain'
import logger from '@/src/utils/logger'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import type { PasskeyMetadata, PasskeyStorage } from '@safe-global/utils/services/passkey'

export type { PasskeyMetadata }

const PASSKEY_SERVICE = 'safe-passkey-metadata'
const PASSKEY_USERNAME = 'passkey-metadata'

function isValidPasskeyMetadata(entry: unknown): entry is PasskeyMetadata {
  if (typeof entry !== 'object' || entry === null) {
    return false
  }
  const obj = entry as Record<string, unknown>
  return (
    typeof obj.rawId === 'string' &&
    typeof obj.identityContractAddresses === 'object' &&
    obj.identityContractAddresses !== null &&
    typeof obj.coordinates === 'object' &&
    obj.coordinates !== null &&
    typeof (obj.coordinates as Record<string, unknown>).x === 'string' &&
    typeof (obj.coordinates as Record<string, unknown>).y === 'string'
  )
}

async function readCollection(): Promise<PasskeyMetadata[]> {
  const result = await Keychain.getGenericPassword({ service: PASSKEY_SERVICE })
  if (!result) {
    return []
  }
  const parsed: unknown = JSON.parse(result.password)
  if (!Array.isArray(parsed)) {
    return []
  }
  return parsed.filter(isValidPasskeyMetadata)
}

async function writeCollection(collection: PasskeyMetadata[]): Promise<void> {
  await Keychain.setGenericPassword(PASSKEY_USERNAME, JSON.stringify(collection), {
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
    service: PASSKEY_SERVICE,
  })
}

export const mobilePasskeyStorage: PasskeyStorage = {
  async getAll() {
    try {
      return await readCollection()
    } catch (err) {
      logger.error('Failed to get passkey metadata:', asError(err).message)
      return []
    }
  },

  async getByRawId(rawId) {
    const collection = await this.getAll()
    return collection.find((entry) => entry.rawId === rawId) ?? null
  },

  async add(metadata) {
    try {
      const collection = await readCollection()
      const idx = collection.findIndex((entry) => entry.rawId === metadata.rawId)
      if (idx >= 0) {
        collection[idx] = metadata
      } else {
        collection.push(metadata)
      }
      await writeCollection(collection)
    } catch (err) {
      logger.error('Failed to add passkey metadata:', asError(err).message)
      throw new Error('Failed to store passkey metadata')
    }
  },

  async removeByRawId(rawId) {
    try {
      const collection = await readCollection()
      await writeCollection(collection.filter((entry) => entry.rawId !== rawId))
    } catch (err) {
      logger.error('Failed to remove passkey metadata:', asError(err).message)
      throw new Error('Failed to remove passkey metadata')
    }
  },

  async markDeployedOnChain(rawId, chainId) {
    const collection = await readCollection()
    const entry = collection.find((e) => e.rawId === rawId)
    if (!entry) {
      throw new Error('No passkey metadata found for rawId')
    }
    if (!entry.deployedOnChains.includes(chainId)) {
      entry.deployedOnChains = [...entry.deployedOnChains, chainId]
      await writeCollection(collection)
    }
  },

  async setIdentityForChain(rawId, chainId, address) {
    const collection = await readCollection()
    const entry = collection.find((e) => e.rawId === rawId)
    if (!entry) {
      throw new Error('No passkey metadata found for rawId')
    }
    if (entry.identityContractAddresses[chainId] !== address) {
      entry.identityContractAddresses = { ...entry.identityContractAddresses, [chainId]: address }
      await writeCollection(collection)
    }
  },
}

// Convenience wrappers used by call sites that don't need the full interface object
export const getAllPasskeyMetadata = () => mobilePasskeyStorage.getAll()
export const getPasskeyMetadataByRawId = (rawId: string) => mobilePasskeyStorage.getByRawId(rawId)
export const addPasskeyMetadata = (metadata: PasskeyMetadata) => mobilePasskeyStorage.add(metadata)
export const removePasskeyByRawId = (rawId: string) => mobilePasskeyStorage.removeByRawId(rawId)
export const updateDeployedChainsByRawId = (rawId: string, chainId: string) =>
  mobilePasskeyStorage.markDeployedOnChain(rawId, chainId)
