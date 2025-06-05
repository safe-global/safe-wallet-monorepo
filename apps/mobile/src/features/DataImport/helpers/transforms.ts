export interface LegacyDataStructure {
  safes?: {
    address: string
    chain: string
    name: string
    threshold?: number
    owners?: string[]
  }[]
  contacts?: {
    address: string
    name: string
    chain: string
  }[]
  keys?: {
    address: string
    name: string
    key: string
  }[]
}

import { AppDispatch } from '@/src/store'
import { addSafe } from '@/src/store/safesSlice'
import { addSignerWithEffects } from '@/src/store/signersSlice'
import { addContact, addContacts, Contact } from '@/src/store/addressBookSlice'
import { storePrivateKey } from '@/src/hooks/useSign/useSign'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import Logger from '@/src/utils/logger'

export const transformSafes = (data: LegacyDataStructure, dispatch: AppDispatch): void => {
  if (!data.safes) {
    return
  }

  for (const safe of data.safes) {
    const safeOverview: SafeOverview = {
      address: {
        value: safe.address,
        name: safe.name || null,
      },
      chainId: safe.chain,
      threshold: safe.threshold || 1,
      owners: (safe.owners || []).map((owner) => ({
        value: owner,
        name: null,
      })),
      fiatTotal: '0',
      queued: 0,
      awaitingConfirmation: null,
    }

    dispatch(
      addSafe({
        address: safe.address as `0x${string}`,
        info: { [safe.chain]: safeOverview },
      }),
    )

    dispatch(
      addContact({
        value: safe.address,
        name: safe.name,
      }),
    )
  }

  Logger.info(`Imported ${data.safes.length} safes`)
}

export const transformKeys = async (data: LegacyDataStructure, dispatch: AppDispatch): Promise<void> => {
  if (!data.keys) {
    return
  }

  for (const key of data.keys) {
    try {
      const hexPrivateKey = `0x${Buffer.from(key.key, 'base64').toString('hex')}`

      await storePrivateKey(key.address, hexPrivateKey)

      const signerInfo: AddressInfo = {
        value: key.address,
        name: key.name || null,
      }

      dispatch(addSignerWithEffects(signerInfo))
      Logger.info(`Imported signer: ${key.address}`)
    } catch (error) {
      Logger.error(`Failed to import signer ${key.address}:`, error)
    }
  }
}

export const transformContacts = (data: LegacyDataStructure, dispatch: AppDispatch): void => {
  if (!data.contacts) {
    return
  }

  const contactsToAdd: Contact[] = data.contacts.map((contact) => ({
    value: contact.address,
    name: contact.name,
  }))

  dispatch(addContacts(contactsToAdd))
  Logger.info(`Imported ${data.contacts.length} contacts`)
}
