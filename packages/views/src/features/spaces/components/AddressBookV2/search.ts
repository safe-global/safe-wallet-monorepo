import type { AddressBookContact } from './types'

export const searchContacts = (contacts: AddressBookContact[], query: string): AddressBookContact[] => {
  const needle = query.trim().toLowerCase()
  if (!needle) return contacts
  return contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(needle) ||
      contact.address.toLowerCase().includes(needle) ||
      Boolean(contact.tags?.some((tag) => tag.name.toLowerCase().includes(needle))),
  )
}

/** A contact must have every selected tag. */
export const filterByTags = (contacts: AddressBookContact[], tagIds: number[]): AddressBookContact[] =>
  tagIds.length === 0
    ? contacts
    : contacts.filter((contact) => tagIds.every((id) => contact.tags?.some((tag) => tag.id === id)))
