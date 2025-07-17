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
import { addSafe as _addSafe } from '@/src/store/safesSlice'
import { addSignerWithEffects as _addSignerWithEffects } from '@/src/store/signersSlice'
import { addContact as _addContact, addContacts, Contact } from '@/src/store/addressBookSlice'
import { storePrivateKey as _storePrivateKey } from '@/src/hooks/useSign/useSign'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { additionalSafesRtkApi } from '@safe-global/store/gateway/safes'
import { addSignerWithEffects } from '@/src/store/signersSlice'
import { storePrivateKey } from '@/src/hooks/useSign/useSign'
import Logger from '@/src/utils/logger'

export interface NotImportedKey {
  address: string
  name: string
  reason: string
}

export const transformSafeData = (safe: NonNullable<LegacyDataStructure['safes']>[0]): SafeOverview => {
  return {
    address: {
      value: safe.address,
      name: safe.name || null,
    },
    chainId: safe.chain,
    threshold: safe.threshold || 1,
    owners: (safe.owners || []).map((owner: string) => ({
      value: owner,
      name: null,
    })),
    fiatTotal: '0',
    queued: 0,
    awaitingConfirmation: null,
  }
}

export const transformKeyData = (
  key: NonNullable<LegacyDataStructure['keys']>[0],
): { address: string; privateKey: string; signerInfo: AddressInfo } => {
  const hexPrivateKey = `0x${Buffer.from(key.key, 'base64').toString('hex')}`

  const signerInfo: AddressInfo = {
    value: key.address,
    name: key.name || null,
  }

  return {
    address: key.address,
    privateKey: hexPrivateKey,
    signerInfo,
  }
}

export const transformContactsData = (contacts: NonNullable<LegacyDataStructure['contacts']>): Contact[] => {
  // Group contacts by address to handle same address on multiple chains
  const contactsMap = new Map<string, Contact>()

  for (const contact of contacts) {
    const address = contact.address.toLowerCase() // Normalize address for consistency

    if (contactsMap.has(address)) {
      // Address already exists, add the chainId if not already present
      const existingContact = contactsMap.get(address)
      if (existingContact && !existingContact.chainIds.includes(contact.chain)) {
        existingContact.chainIds.push(contact.chain)
      }
    } else {
      // New address, create new contact
      contactsMap.set(address, {
        value: contact.address, // Keep original casing
        name: contact.name,
        chainIds: [contact.chain],
      })
    }
  }

  return Array.from(contactsMap.values())
}

interface SafeInfo {
  address: string
  chainId: string
}

// Function to create delay for throttling
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

// Function to chunk array into smaller arrays
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export type ImportProgressCallback = (progress: number, message: string) => void

// Constants for import delays
const KEY_IMPORT_DELAY = 1000 // 1 second delay between key imports to throttle delegate creation

/**
 * Adds safe addresses to the Redux state with minimal data, then fetches complete SafeOverview data.
 * This two-step process is required because the safesSlice extraReducer only updates existing safes.
 */
export const fetchAndStoreSafeOverviews = async (
  safes: SafeInfo[],
  currency = 'USD',
  dispatch: AppDispatch,
  progressCallback?: ImportProgressCallback,
): Promise<Set<string>> => {
  if (safes.length === 0) {
    return new Set()
  }

  // Step 1: Add safe addresses to state with minimal data so extraReducer can update them
  Logger.info(`Pre-populating ${safes.length} safe addresses in Redux state`)
  progressCallback?.(0, 'Preparing safes for data fetch...')

  for (const safe of safes) {
    // Add safe with minimal data - the extraReducer will update this with full data
    const minimalSafeOverview: SafeOverview = {
      address: { value: safe.address, name: null },
      chainId: safe.chainId,
      threshold: 1,
      owners: [],
      fiatTotal: '0',
      queued: 0,
      awaitingConfirmation: null,
    }

    dispatch(
      _addSafe({
        address: safe.address as `0x${string}`,
        info: { [safe.chainId]: minimalSafeOverview },
      }),
    )
  }

  // Step 2: Fetch complete SafeOverview data - this will trigger the extraReducer to update the state
  const allOwners = new Set<string>()
  const BATCH_SIZE = 10
  const THROTTLE_DELAY = 300 // 300ms between requests

  // Create safe IDs in the format expected by the API
  const safeIds = safes.map((safe) => `${safe.chainId}:${safe.address}`)
  const chunks = chunkArray(safeIds, BATCH_SIZE)

  Logger.info(`Fetching complete SafeOverview data for ${safes.length} safes in ${chunks.length} batches`)

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const batchProgress = Math.round((i / chunks.length) * 100)

    Logger.info(`Processing batch ${i + 1}/${chunks.length} with ${chunk.length} safes`)
    progressCallback?.(batchProgress, `Fetching safe data (batch ${i + 1}/${chunks.length})`)

    try {
      // Make the API call for this batch - this will trigger the extraReducer to update the state
      const response = await dispatch(
        additionalSafesRtkApi.endpoints.safesGetOverviewForMany.initiate({
          safes: chunk,
          currency,
          trusted: true,
          excludeSpam: true,
        }),
      ).unwrap()

      // Extract owners from the response
      for (const safeOverview of response) {
        if (safeOverview.owners) {
          safeOverview.owners.forEach((owner: AddressInfo) => {
            allOwners.add(owner.value.toLowerCase())
          })
        }
      }

      // Add throttling delay between requests (except for the last batch)
      if (i < chunks.length - 1) {
        await delay(THROTTLE_DELAY)
      }
    } catch (error) {
      Logger.error(`Failed to fetch safe information for batch ${i + 1}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        chunk,
      })
      // Continue with next batch even if one fails
    }
  }

  progressCallback?.(100, `Fetched complete data for ${safes.length} safes`)
  Logger.info(`Extracted ${allOwners.size} unique owners from ${safes.length} safes`)
  Logger.info(`Complete SafeOverview data has been stored in Redux store via RTK query extraReducer`)
  return allOwners
}

/**
 * Stores safe addresses as contacts in the address book.
 * This function only handles contact creation and does NOT create SafeOverview data,
 * as that should be handled by fetchAndStoreSafeOverviews.
 */
export const storeSafeContacts = (data: LegacyDataStructure, dispatch: AppDispatch): void => {
  if (!data.safes) {
    return
  }

  Logger.info(`Storing ${data.safes.length} safe addresses as contacts`)

  for (const safe of data.safes) {
    dispatch(
      _addContact({
        value: safe.address,
        name: safe.name,
        chainIds: [],
      }),
    )
  }

  Logger.info(`Stored ${data.safes.length} safe contacts`)
}

export const storeContacts = (data: LegacyDataStructure, dispatch: AppDispatch): void => {
  if (!data.contacts) {
    return
  }

  const contactsToAdd = transformContactsData(data.contacts)

  dispatch(addContacts(contactsToAdd))
  Logger.info(`Imported ${contactsToAdd.length} contacts from ${data.contacts.length} contact entries`)
}

export const storeKeysWithValidation = async (
  data: LegacyDataStructure,
  allOwners: Set<string>,
  dispatch: AppDispatch,
  updateNotImportedKeys: (keys: NotImportedKey[]) => void,
  createDelegate: (
    ownerPrivateKey: string,
    safe?: string | null,
  ) => Promise<{
    success: boolean
    delegateAddress?: string
    error?: string
  }>,
  progressCallback?: ImportProgressCallback,
): Promise<void> => {
  if (!data.keys) {
    return
  }

  const notImportedKeys: NotImportedKey[] = []
  let importedCount = 0

  Logger.info(`Validating ${data.keys.length} keys against ${allOwners.size} safe owners`)

  for (let i = 0; i < data.keys.length; i++) {
    const key = data.keys[i]
    const keyAddress = key.address.toLowerCase()
    const keyProgress = Math.round((i / data.keys.length) * 100)

    progressCallback?.(keyProgress, `Processing key ${i + 1}/${data.keys.length}`)

    if (!allOwners.has(keyAddress)) {
      // Key is not an owner of any safe, don't import it
      notImportedKeys.push({
        address: key.address,
        name: key.name || 'Unknown',
        reason: 'Not an owner of any imported safe',
      })

      Logger.info(`Key ${key.address} not imported - not an owner of any safe`)
      continue
    }

    // Key is an owner, proceed with import
    try {
      const { address, privateKey, signerInfo } = transformKeyData(key)

      await storePrivateKey(address, privateKey)
      dispatch(addSignerWithEffects(signerInfo))

      // Create delegate for this owner
      try {
        progressCallback?.(keyProgress, `Creating delegate for ${key.name || key.address}`)

        // Pass null as safe address to create a delegate for the chain, not for a specific safe
        const delegateResult = await createDelegate(privateKey, null)

        if (!delegateResult.success) {
          Logger.error('Failed to create delegate during data import', {
            address: key.address,
            error: delegateResult.error,
          })
        } else {
          Logger.info(`Delegate created successfully for key ${key.address}`)
        }
      } catch (delegateError) {
        // Log the error but continue with the import - delegate creation failure shouldn't prevent key import
        Logger.error('Error creating delegate during data import', {
          address: key.address,
          error: delegateError instanceof Error ? delegateError.message : 'Unknown error',
        })
      }

      importedCount++
      Logger.info(`Key ${key.address} successfully imported`)

      // Add delay between key imports to throttle delegate creation requests
      // Skip delay for the last key to avoid unnecessary waiting
      if (i < data.keys.length - 1) {
        Logger.info(`Waiting ${KEY_IMPORT_DELAY}ms before processing next key...`)
        await delay(KEY_IMPORT_DELAY)
      }
    } catch (error) {
      Logger.error('Failed to import validated key', {
        error: error instanceof Error ? error.message : 'Unknown error',
        address: key.address,
      })

      notImportedKeys.push({
        address: key.address,
        name: key.name || 'Unknown',
        reason: 'Import failed due to technical error',
      })
    }
  }

  // Update the context with not imported keys
  updateNotImportedKeys(notImportedKeys)

  progressCallback?.(100, `Completed: ${importedCount} keys imported`)
  Logger.info(`Import validation complete: ${importedCount} keys imported, ${notImportedKeys.length} keys not imported`)
}

// Legacy function - keeping for backward compatibility
export const fetchSafeOwnersInBatches = fetchAndStoreSafeOverviews
