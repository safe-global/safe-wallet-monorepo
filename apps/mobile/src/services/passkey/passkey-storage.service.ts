import * as Keychain from 'react-native-keychain'
import logger from '@/src/utils/logger'
import { asError } from '@safe-global/utils/services/exceptions/utils'

const PASSKEY_SERVICE = 'safe-passkey-metadata'
const PASSKEY_USERNAME = 'passkey-metadata'

export interface PasskeyMetadata {
  rawId: string
  coordinates: { x: string; y: string }
  identityContractAddress: string
  deployedOnChains: string[]
}

export async function storePasskeyMetadata(metadata: PasskeyMetadata): Promise<void> {
  try {
    await Keychain.setGenericPassword(PASSKEY_USERNAME, JSON.stringify(metadata), {
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
      service: PASSKEY_SERVICE,
    })
  } catch (err) {
    logger.error('Failed to store passkey metadata:', asError(err).message)
    throw new Error('Failed to store passkey metadata')
  }
}

export async function getPasskeyMetadata(): Promise<PasskeyMetadata | null> {
  try {
    const result = await Keychain.getGenericPassword({ service: PASSKEY_SERVICE })
    if (!result) {
      return null
    }
    return JSON.parse(result.password) as PasskeyMetadata
  } catch (err) {
    logger.error('Failed to get passkey metadata:', asError(err).message)
    return null
  }
}

export async function removePasskeyMetadata(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({ service: PASSKEY_SERVICE })
  } catch (err) {
    logger.error('Failed to remove passkey metadata:', asError(err).message)
    throw new Error('Failed to remove passkey metadata')
  }
}

export async function updateDeployedChains(chainId: string): Promise<void> {
  const metadata = await getPasskeyMetadata()
  if (!metadata) {
    throw new Error('No passkey metadata found')
  }

  if (!metadata.deployedOnChains.includes(chainId)) {
    metadata.deployedOnChains = [...metadata.deployedOnChains, chainId]
    await storePasskeyMetadata(metadata)
  }
}
