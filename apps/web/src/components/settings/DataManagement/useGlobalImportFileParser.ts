import { logError } from '@/services/exceptions'
import ErrorCodes from '@/services/exceptions/ErrorCodes'
import { migrateAddedSafes } from '@/services/ls-migration/addedSafes'
import { migrateAddressBook } from '@/services/ls-migration/addressBook'
import { isChecksummedAddress } from '@safe-global/utils/utils/addresses'
import type { AddressBook, AddressBookState } from '@/store/addressBookSlice'
import type { AddedSafesState } from '@/store/addedSafesSlice'
import type { SafeAppsState } from '@/store/safeAppsSlice'
import type { SettingsState } from '@/store/settingsSlice'
import type { UndeployedSafesState } from '@/features/counterfactual/store/undeployedSafesSlice'

import { useMemo } from 'react'
import type { VisitedSafesState } from '@/store/visitedSafesSlice'

export const enum SAFE_EXPORT_VERSION {
  V1 = '1.0',
  V2 = '2.0',
  V3 = '3.0',
}

export enum ImportErrors {
  INVALID_VERSION = 'The file is not a valid export.',
  INVALID_JSON_FORMAT = 'The JSON format is invalid.',
  NO_IMPORT_DATA_FOUND = 'This file contains no importable data.',
}

const countEntries = (data: { [chainId: string]: { [address: string]: unknown } }) =>
  Object.values(data).reduce<number>((count, entry) => count + Object.keys(entry).length, 0)

export const _filterValidAbEntries = (ab?: AddressBookState): AddressBookState | undefined => {
  if (!ab) {
    return undefined
  }

  return Object.entries(ab).reduce<AddressBookState>((acc, [chainId, chainAb]) => {
    const sanitizedChainAb = Object.entries(chainAb).reduce<AddressBook>((acc, [address, name]) => {
      // Legacy imported address books could have undefined name or address entries
      if (name?.trim() && address && isChecksummedAddress(address)) {
        acc[address] = name
      }
      return acc
    }, {})

    if (Object.keys(sanitizedChainAb).length > 0) {
      acc[chainId] = sanitizedChainAb
    }

    return acc
  }, {})
}

/**
 * The global import currently imports:
 * 1.0:
 *  - address book
 *  - added Safes
 *
 * 2.0:
 *  - address book
 *  - added Safes
 *  - safeApps
 *  - settings
 *
 * 3.0:
 *  - address book
 *  - added Safes
 *  - safeApps
 *  - settings
 *  - visited Safes
 *
 * @param jsonData
 * @returns data to import and some insights about it
 */

type Data = {
  addedSafes?: AddedSafesState
  addressBook?: AddressBookState
  settings?: SettingsState
  safeApps?: SafeAppsState
  undeployedSafes?: UndeployedSafesState
  visitedSafes?: VisitedSafesState
  error?: ImportErrors
  addressBookEntriesCount: number
  addedSafesCount: number
}

export const useGlobalImportJsonParser = (jsonData: string | undefined): Data => {
  return useMemo(() => {
    const data: Data = {
      addressBookEntriesCount: 0,
      addedSafesCount: 0,
      addressBook: undefined,
      addedSafes: undefined,
      settings: undefined,
      safeApps: undefined,
      undeployedSafes: undefined,
      visitedSafes: undefined,
    }

    if (!jsonData) {
      return data
    }

    let parsedFile

    try {
      parsedFile = JSON.parse(jsonData)
    } catch (err) {
      logError(ErrorCodes._704, err)

      data.error = ImportErrors.INVALID_JSON_FORMAT
      return data
    }

    if (!parsedFile.data || Object.keys(parsedFile.data).length === 0) {
      data.error = ImportErrors.NO_IMPORT_DATA_FOUND
      return data
    }

    switch (parsedFile.version) {
      case SAFE_EXPORT_VERSION.V1: {
        data.addressBook = migrateAddressBook(parsedFile.data) ?? undefined
        data.addedSafes = migrateAddedSafes(parsedFile.data) ?? undefined

        break
      }

      case SAFE_EXPORT_VERSION.V2: {
        data.addressBook = _filterValidAbEntries(parsedFile.data.addressBook)
        data.addedSafes = parsedFile.data.addedSafes
        data.settings = parsedFile.data.settings
        data.safeApps = parsedFile.data.safeApps
        data.undeployedSafes = parsedFile.data.undeployedSafes

        break
      }

      case SAFE_EXPORT_VERSION.V3: {
        data.addressBook = _filterValidAbEntries(parsedFile.data.addressBook)
        data.addedSafes = parsedFile.data.addedSafes
        data.settings = parsedFile.data.settings
        data.safeApps = parsedFile.data.safeApps
        data.undeployedSafes = parsedFile.data.undeployedSafes
        data.visitedSafes = parsedFile.data.visitedSafes

        break
      }

      default: {
        data.error = ImportErrors.INVALID_VERSION
      }
    }

    data.addressBookEntriesCount = data.addressBook ? countEntries(data.addressBook) : 0
    data.addedSafesCount = data.addedSafes ? countEntries(data.addedSafes) : 0

    return data
  }, [jsonData])
}
