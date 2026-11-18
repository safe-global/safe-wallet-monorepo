import type {
  SpaceAddressBookItemDto,
  SpaceAddressBookTagDto,
  UpsertAddressBookItem,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { checksumAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import { sanitizeName } from '@safe-global/utils/validation/names'
import {
  CONTACT_TAG_LIMIT_MESSAGE,
  MAX_TAGS_PER_CONTACT,
  MAX_TAGS_PER_WORKSPACE,
  normalizeTagName,
  sameTagName,
  validateTagName,
} from '@safe-global/utils/validation/tags'
import type { AddressBookCSVRow } from '@/components/address-book/ImportDialog'
import { CSV_TAG_SEPARATOR } from '../../utils/addressBookCsv'
import { validateContactName } from '../SpaceAddressBook/utils'
import { tagNamesOf } from './utils'

// CGW's default SPACES_MAX_ADDRESS_BOOK_ITEMS_PER_SPACE, mirrored so a too-big file is explained before the request; CGW stays the authority.
export const MAX_CONTACTS_PER_WORKSPACE = 500

export type WorkspaceImport = {
  /** New contacts, plus saved contacts that gain chains or tags. */
  items: UpsertAddressBookItem[]
  newCount: number
  updatedCount: number
  /** Networks the import adds contacts to; a contact that only gains tags adds none. */
  networkCount: number
}

const findSaved = (savedItems: SpaceAddressBookItemDto[], address: string) =>
  savedItems.find((item) => sameAddress(item.address, address))

/** The tag names in a `tags` cell; a blank cell or no `tags` column has none. */
const parseTagsCell = (cell: string | undefined): string[] =>
  (cell ?? '')
    .split(CSV_TAG_SEPARATOR)
    .map((name) => name.trim())
    .filter(Boolean)

/** `names` plus those in `added` it doesn't have yet, ignoring case and extra spaces. */
const mergeTagNames = (names: string[], added: string[]): string[] =>
  added.reduce((merged, name) => (merged.some((saved) => sameTagName(saved, name)) ? merged : [...merged, name]), names)

/** A workspace tag's own spelling, so a file tag in another case doesn't read as a new tag. */
const toWorkspaceTagName = (name: string, workspaceTags: SpaceAddressBookTagDto[]): string =>
  workspaceTags.find((tag) => sameTagName(tag.name, name))?.name ?? normalizeTagName(name)

/**
 * The first reason the workspace book can't take the file: a bad row, or more contacts or tags than a workspace holds.
 * A saved contact keeps its name, so its name in the file isn't checked.
 */
export const validateWorkspaceRows = (
  rows: AddressBookCSVRow[],
  savedItems: SpaceAddressBookItemDto[],
  workspaceTags: SpaceAddressBookTagDto[],
  supportedChainIds: string[],
): string | undefined => {
  const contactTags = new Map<string, string[]>()
  let workspaceTagNames = workspaceTags.map((tag) => tag.name)

  for (const [index, [address, name, chainId, tagsCell]] of rows.entries()) {
    // + 2 for the header and the 1-based row number, as in the file format checks
    const row = index + 2
    if (!supportedChainIds.includes(chainId.trim())) {
      return `Row ${row}: chain ${chainId.trim()} is not supported`
    }
    const saved = findSaved(savedItems, address.trim())
    const nameError = saved ? undefined : validateContactName(name)
    if (nameError) {
      return `Row ${row}: ${nameError}`
    }

    const tags = parseTagsCell(tagsCell)
    const tagError = tags.map(validateTagName).find(Boolean)
    if (tagError) {
      return `Row ${row}: ${tagError}`
    }

    const key = address.trim().toLowerCase()
    const savedTags = saved ? tagNamesOf(saved.tagIds, workspaceTags) : []
    const merged = mergeTagNames(contactTags.get(key) ?? savedTags, tags)
    if (merged.length > MAX_TAGS_PER_CONTACT) {
      return `Row ${row}: ${CONTACT_TAG_LIMIT_MESSAGE}`
    }
    contactTags.set(key, merged)

    workspaceTagNames = mergeTagNames(workspaceTagNames, tags)
    if (workspaceTagNames.length > MAX_TAGS_PER_WORKSPACE) {
      return `Row ${row}: a workspace can have at most ${MAX_TAGS_PER_WORKSPACE} tags`
    }
  }

  const newCount = [...contactTags.keys()].filter((key) => !findSaved(savedItems, key)).length
  const room = Math.max(MAX_CONTACTS_PER_WORKSPACE - savedItems.length, 0)
  if (newCount > room) {
    return `This file adds ${newCount} contacts, but the workspace has room for ${room} more (at most ${MAX_CONTACTS_PER_WORKSPACE})`
  }
}

/** One item per address: chains and tags merged with the saved ones, saved names kept, unchanged contacts left out. */
export const toWorkspaceImport = (
  rows: AddressBookCSVRow[],
  savedItems: SpaceAddressBookItemDto[],
  workspaceTags: SpaceAddressBookTagDto[],
): WorkspaceImport => {
  const fromFile = new Map<string, Required<UpsertAddressBookItem>>()
  for (const [address, name, chainId, tagsCell] of rows) {
    const key = address.trim().toLowerCase()
    const previous = fromFile.get(key)
    const chainIds = previous?.chainIds ?? []
    const tags = parseTagsCell(tagsCell).map((tag) => toWorkspaceTagName(tag, workspaceTags))
    // The last name wins, as in the local address book import
    fromFile.set(key, {
      address: checksumAddress(address.trim()),
      name: sanitizeName(name),
      chainIds: chainIds.includes(chainId.trim()) ? chainIds : [...chainIds, chainId.trim()],
      tags: mergeTagNames(previous?.tags ?? [], tags),
    })
  }

  const result: WorkspaceImport = { items: [], newCount: 0, updatedCount: 0, networkCount: 0 }
  const addedNetworks = new Set<string>()
  for (const { tags, ...contact } of fromFile.values()) {
    const saved = findSaved(savedItems, contact.address)
    if (!saved) {
      result.items.push(tags.length > 0 ? { ...contact, tags } : contact)
      result.newCount++
      contact.chainIds.forEach((chainId) => addedNetworks.add(chainId))
      continue
    }

    const addedChainIds = contact.chainIds.filter((chainId) => !saved.chainIds.includes(chainId))
    const savedTags = tagNamesOf(saved.tagIds, workspaceTags)
    const mergedTags = mergeTagNames(savedTags, tags)
    // Tags are sent only when they change, as sending them replaces the saved ones
    const gainsTags = mergedTags.length > savedTags.length
    if (addedChainIds.length > 0 || gainsTags) {
      result.items.push({
        address: saved.address,
        name: saved.name,
        chainIds: [...saved.chainIds, ...addedChainIds],
        ...(gainsTags && { tags: mergedTags }),
      })
      result.updatedCount++
      addedChainIds.forEach((chainId) => addedNetworks.add(chainId))
    }
  }
  result.networkCount = addedNetworks.size
  return result
}
