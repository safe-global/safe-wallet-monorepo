import Papa from 'papaparse'

import { abOnUploadValidator } from '@/components/address-book/ImportDialog/validation'
import { parseGlobalImportJson } from '@/components/settings/DataManagement/useGlobalImportFileParser'
import type { AddressBookItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

export type ParsedAddressBook = {
  items: AddressBookItem[]
  error?: string
}

const NO_SUPPORTED_CHAINS_ERROR = 'No entries found for supported chains'
const NO_AB_ENTRIES_ERROR = 'No address book entries found in file'
const UNSUPPORTED_FILE_ERROR = 'Unsupported file type. Please upload a CSV or JSON file.'

const hasEntry = (row: string[]) => row.length === 3 && !!row[0] && !!row[1] && !!row[2]

const filterToSupportedChains = (items: AddressBookItem[], supportedChainIds: string[]): ParsedAddressBook => {
  const filtered = items
    .filter((item) => item.chainIds.some((chainId) => supportedChainIds.includes(chainId)))
    .map((item) => ({ ...item, name: item.name.trim() }))

  if (filtered.length === 0) {
    return { items: [], error: NO_SUPPORTED_CHAINS_ERROR }
  }

  return { items: filtered }
}

const parseCsv = (content: string, supportedChainIds: string[]): ParsedAddressBook => {
  const result = Papa.parse<string[]>(content, { skipEmptyLines: 'greedy' })
  const data = result.data.filter(hasEntry)

  const error = abOnUploadValidator({ ...result, data })
  if (error) {
    return { items: [], error }
  }

  const [, ...entries] = data
  const items = entries.map(([address, name, chainId]) => ({ address, name, chainIds: [chainId.trim()] }))

  return filterToSupportedChains(items, supportedChainIds)
}

const parseJson = (content: string, supportedChainIds: string[]): ParsedAddressBook => {
  const parsed = parseGlobalImportJson(content)

  if (parsed.error) {
    return { items: [], error: parsed.error }
  }

  if (!parsed.addressBook || parsed.addressBookEntriesCount === 0) {
    return { items: [], error: NO_AB_ENTRIES_ERROR }
  }

  const items = Object.entries(parsed.addressBook).flatMap(([chainId, entries]) =>
    Object.entries(entries).map(([address, name]) => ({ address, name, chainIds: [chainId] })),
  )

  return filterToSupportedChains(items, supportedChainIds)
}

/**
 * Parses an exported address book file into items ready for the Spaces upsert mutation.
 *
 * Accepts the same CSV format as the local address book (header `address,name,chainId`)
 * and the global data-export JSON shape (`{ version, data: { addressBook } }`).
 * Entries on chains the app doesn't support are dropped.
 */
export const parseImportedAddressBook = (
  fileName: string,
  content: string,
  supportedChainIds: string[],
): ParsedAddressBook => {
  const extension = fileName.split('.').pop()?.toLowerCase()

  if (extension === 'csv') {
    return parseCsv(content, supportedChainIds)
  }

  if (extension === 'json') {
    return parseJson(content, supportedChainIds)
  }

  return { items: [], error: UNSUPPORTED_FILE_ERROR }
}
