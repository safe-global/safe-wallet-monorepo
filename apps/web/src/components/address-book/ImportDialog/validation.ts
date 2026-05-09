import type { ParseResult } from 'papaparse'

import { validateAddress } from '@safe-global/utils/utils/validation'

export const abCsvReaderValidator = ({ size }: File): string[] | undefined => {
  if (size > 1_000_000) {
    return ['Address book cannot be larger than 1MB']
  }
}

export const hasValidAbHeader = (header: string[]) => {
  return header.length === 3 && header[0] === 'address' && header[1] === 'name' && header[2] === 'chainId'
}

export const hasValidAbEntryAddresses = (entries: string[][]) => {
  return entries.every((entry) => entry.length >= 1 && !validateAddress(entry[0]))
}

export const hasValidAbNames = (entries: string[][]) => {
  return entries.every((entry) => entry.length >= 2 && !!entry[1])
}

export const abOnUploadValidator = ({ data, errors }: ParseResult<string[]>): string | undefined => {
  const [header, ...entries] = data

  // papaparse error
  if (errors.length > 0) {
    return errors[0].message
  }

  // Empty CSV
  if (data.length === 0) {
    return 'CSV file is empty'
  }

  // Wrong header
  if (!hasValidAbHeader(header)) {
    return 'Invalid or corrupt address book header'
  }

  // No entries
  if (entries.length === 0) {
    return 'No entries found in address book'
  }

  // We + 2 to each row to make up for header and index

  // An entry has invalid address
  if (!hasValidAbEntryAddresses(entries)) {
    const i = entries.findIndex((entry) => (entry.length >= 1 ? validateAddress(entry[0]) : true))
    return `Address book contains an invalid address on row ${i + 2}`
  }

  // An entry has invalid name
  if (!hasValidAbNames(entries)) {
    const i = entries.findIndex((entry) => (entry.length >= 2 ? !entry[1] : true))
    return `Address book contains an invalid name on row ${i + 2}`
  }
}
