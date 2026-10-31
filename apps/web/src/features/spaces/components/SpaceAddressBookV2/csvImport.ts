import type { AddressBookItem, SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { checksumAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import { sanitizeName } from '@safe-global/utils/validation/names'
import type { AddressBookCSVRow } from '@/components/address-book/ImportDialog'
import { validateContactName } from '../SpaceAddressBook/utils'

export type WorkspaceImport = {
  /** New contacts, plus saved contacts that gain chains. */
  items: AddressBookItem[]
  newCount: number
  updatedCount: number
}

const findSaved = (savedItems: SpaceAddressBookItemDto[], address: string) =>
  savedItems.find((item) => sameAddress(item.address, address))

/** The first row the workspace book can't take. A saved contact keeps its name, so its name in the file isn't checked. */
export const validateWorkspaceRows = (
  rows: AddressBookCSVRow[],
  savedItems: SpaceAddressBookItemDto[],
  supportedChainIds: string[],
): string | undefined => {
  for (const [index, [address, name, chainId]] of rows.entries()) {
    // + 2 for the header and the 1-based row number, as in the file format checks
    const row = index + 2
    if (!supportedChainIds.includes(chainId.trim())) {
      return `Row ${row}: chain ${chainId.trim()} is not supported`
    }
    const nameError = findSaved(savedItems, address.trim()) ? undefined : validateContactName(name)
    if (nameError) {
      return `Row ${row}: ${nameError}`
    }
  }
}

/** One item per address: chains merged with the saved ones, saved names kept, unchanged contacts left out. */
export const toWorkspaceImport = (
  rows: AddressBookCSVRow[],
  savedItems: SpaceAddressBookItemDto[],
): WorkspaceImport => {
  const fromFile = new Map<string, AddressBookItem>()
  for (const [address, name, chainId] of rows) {
    const key = address.trim().toLowerCase()
    const chainIds = fromFile.get(key)?.chainIds ?? []
    // The last name wins, as in the local address book import
    fromFile.set(key, {
      address: checksumAddress(address.trim()),
      name: sanitizeName(name),
      chainIds: chainIds.includes(chainId.trim()) ? chainIds : [...chainIds, chainId.trim()],
    })
  }

  const result: WorkspaceImport = { items: [], newCount: 0, updatedCount: 0 }
  for (const contact of fromFile.values()) {
    const saved = findSaved(savedItems, contact.address)
    if (!saved) {
      result.items.push(contact)
      result.newCount++
      continue
    }

    const addedChainIds = contact.chainIds.filter((chainId) => !saved.chainIds.includes(chainId))
    if (addedChainIds.length > 0) {
      result.items.push({ address: saved.address, name: saved.name, chainIds: [...saved.chainIds, ...addedChainIds] })
      result.updatedCount++
    }
  }
  return result
}
