import { allTagsOf, SYSTEM_TAGS, systemTagsOf } from './tags/systemTags'
import type { AddressBookContact, ContactFilters, TagCount } from './types'

const matchesQuery = (contact: AddressBookContact, query: string): boolean => {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return (
    contact.name.toLowerCase().includes(needle) ||
    contact.address.toLowerCase().includes(needle) ||
    allTagsOf(contact).some((tag) => tag.toLowerCase().includes(needle))
  )
}

/** Search, then tags: a contact needs every selected tag, automatic or not. */
export const filterContacts = (contacts: AddressBookContact[], filters: ContactFilters): AddressBookContact[] =>
  contacts.filter((contact) => {
    if (!matchesQuery(contact, filters.query)) return false
    if (filters.tags.length > 0) {
      const tags = allTagsOf(contact).map((tag) => tag.toLowerCase())
      if (!filters.tags.every((tag) => tags.includes(tag.toLowerCase()))) return false
    }
    return true
  })

/** Distinct team-written tags in the book, most used first, then alphabetically. */
export const countTags = (contacts: AddressBookContact[]): TagCount[] => {
  const counts = new Map<string, TagCount>()
  for (const contact of contacts) {
    for (const tag of contact.tags) {
      const key = tag.toLowerCase()
      const entry = counts.get(key)
      if (entry) entry.count++
      else counts.set(key, { tag, count: 1 })
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

/** The automatic tags that at least one contact carries, in their fixed order. */
export const countSystemTags = (contacts: AddressBookContact[]): TagCount[] =>
  SYSTEM_TAGS.map((tag) => ({
    tag,
    count: contacts.filter((contact) => systemTagsOf(contact).includes(tag)).length,
  })).filter(({ count }) => count > 0)

/** Sorts the Tags column: automatic tags first, so workspace Safes and signers group together. */
export const tagSortValue = (contact: AddressBookContact): string | null => {
  const [first] = allTagsOf(contact)
  if (!first) return null
  const systemIndex = SYSTEM_TAGS.indexOf(first as (typeof SYSTEM_TAGS)[number])
  return systemIndex >= 0 ? `0${systemIndex}` : `1${first.toLowerCase()}`
}

export const activeFilterCount = (filters: ContactFilters): number => filters.tags.length
