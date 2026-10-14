import type { AddressBookContact, CategoryFilterValue, ContactFilters, TagCount } from './types'

/** Sort order of the Category column: workspace Safes first, unknown last. */
const CATEGORY_RANK: Record<AddressBookContact['category'], number> = {
  'workspace-safe': 0,
  safe: 1,
  contract: 2,
  eoa: 3,
  unknown: 4,
  loading: 5,
}

export const categoryRank = (contact: AddressBookContact): number => CATEGORY_RANK[contact.category]

/** Every Category filter value a contact matches: its category, plus `signer` when it signs a workspace Safe. */
export const categoryValues = (contact: AddressBookContact): CategoryFilterValue[] => {
  const values: CategoryFilterValue[] = []
  if (contact.category !== 'loading') values.push(contact.category)
  if (contact.signerOf.length > 0) values.push('signer')
  return values
}

const matchesQuery = (contact: AddressBookContact, query: string): boolean => {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return (
    contact.name.toLowerCase().includes(needle) ||
    contact.address.toLowerCase().includes(needle) ||
    contact.tags.some((tag) => tag.toLowerCase().includes(needle))
  )
}

/** Search, then OR within a facet and AND across facets; a contact needs every selected tag. */
export const filterContacts = (contacts: AddressBookContact[], filters: ContactFilters): AddressBookContact[] =>
  contacts.filter((contact) => {
    if (!matchesQuery(contact, filters.query)) return false
    if (filters.categories.length > 0) {
      const values = categoryValues(contact)
      if (!filters.categories.some((value) => values.includes(value))) return false
    }
    if (filters.tags.length > 0) {
      const tags = contact.tags.map((tag) => tag.toLowerCase())
      if (!filters.tags.every((tag) => tags.includes(tag.toLowerCase()))) return false
    }
    return true
  })

export const countCategories = (contacts: AddressBookContact[]): Map<CategoryFilterValue, number> => {
  const counts = new Map<CategoryFilterValue, number>()
  for (const contact of contacts) {
    for (const value of categoryValues(contact)) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return counts
}

/** Distinct tags in the book, most used first, then alphabetically. */
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

export const activeFilterCount = (filters: ContactFilters): number => filters.categories.length + filters.tags.length
